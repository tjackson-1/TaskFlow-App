import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Platform } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { supabase } from "../utils/supabase";

interface EventItem {
  event_id: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
}

// date helpers (everything is handled in the device's local time)

const toLocalDateString = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Works for both "2026-11-09" and ISO timestamps
const eventDateKey = (value: string) =>
  value.length === 10 ? value : toLocalDateString(new Date(value));

// "8:00 AM", "8am", "13:30" -> {h, m} or null
const parseTime = (input: string) => {
  const match = input.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3]?.toLowerCase();
  if (meridiem === "pm" && h < 12) h += 12;
  if (meridiem === "am" && h === 12) h = 0;
  if (h > 23 || m > 59) return null;
  return { h, m };
};

// Builds an ISO timestamp for the given day at the given time (blank = start of day)
const buildTimestamp = (dateStr: string, timeStr: string) => {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const t = timeStr.trim() ? parseTime(timeStr) : { h: 0, m: 0 };
  if (!t) return null;
  return new Date(y, mo - 1, d, t.h, t.m).toISOString();
};

const formatTime = (value: string) => {
  if (value.length === 10) return "";
  const d = new Date(value);
  if (d.getHours() === 0 && d.getMinutes() === 0) return ""; // treat midnight as "all day"
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const confirmDelete = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: onConfirm },
  ]);
};

export default function CalendarCard() {
  const [selectedDate, setSelectedDate] = useState(toLocalDateString(new Date()));

  // events for the logged in user, by local date
  const [events, setEvents] = useState<{ [key: string]: EventItem[] }>({});
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // event form (used for both adding and editing)
  const [newTitle, setNewTitle] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // edit mode: which event is being edited, and which day it lives on
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingDate, setEditingDate] = useState("");

  // load user and events

  const fetchUserAndEvents = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        console.log("No user logged in");
        return;
      }

      const { data: userRows, error: userError } = await supabase
        .from("User")
        .select("user_id")
        .eq("supabase_uid", session.user.id)
        .limit(1);

      if (userError || !userRows || userRows.length === 0) {
        console.error("Error fetching user mapping:", userError?.message);
        Alert.alert("Database Error", "No public user profile found. Try signing out and signing back in.");
        return;
      }

      const userId = userRows[0].user_id;
      setCurrentUserId(userId);

      const { data, error } = await supabase
        .from("Calendar_Event")
        .select("*")
        .eq("user_id", userId)
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error fetching events:", error.message);
        return;
      }
      if (!data) return;

      const grouped: { [key: string]: EventItem[] } = {};
      data.forEach((item: EventItem) => {
        if (!item.start_time) return;
        const key = eventDateKey(item.start_time);
        (grouped[key] = grouped[key] || []).push(item);
      });
      setEvents(grouped);
    } catch (err) {
      console.error("Unexpected error loading user events:", err);
    }
  }, []);

  useEffect(() => {
    fetchUserAndEvents();
  }, [fetchUserAndEvents]);

  // Gmail sync

  const handleGmailSync = async () => {
    if (!currentUserId) {
      Alert.alert("Authentication error", "User profile not loaded yet.");
      return;
    }

    try {
      setIsSyncing(true);

      const { data: tokenRecord, error: tokenError } = await supabase
        .from("user_gmail_tokens")
        .select("access_token")
        .eq("user_id", currentUserId)
        .maybeSingle();

      if (tokenError || !tokenRecord?.access_token) {
        Alert.alert("Gmail Not Connected", "Please connect your Gmail inbox first using the button above.");
        return;
      }

      const authHeader = { Authorization: `Bearer ${tokenRecord.access_token}` };

      const res = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5&q=is:unread",
        { headers: authHeader }
      );

      if (res.status === 401) {
        Alert.alert("Gmail session expired", "Please reconnect your Gmail account.");
        return;
      }
      if (!res.ok) {
        throw new Error(`Gmail API error (${res.status})`);
      }

      const listData = await res.json();
      if (!listData.messages || listData.messages.length === 0) {
        Alert.alert("Gmail Sync", "No new unread emails found to sync.");
        return;
      }

      // existing Gmail events, so repeated syncs don't create duplicates
      const { data: existing } = await supabase
        .from("Calendar_Event")
        .select("title, start_time")
        .eq("user_id", currentUserId)
        .eq("location", "Gmail Inbox");

      const seen = new Set(
        (existing || []).map((e: any) => `${e.title}|${new Date(e.start_time).getTime()}`)
      );

      const rows: any[] = [];
      for (const msg of listData.messages) {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject`,
          { headers: authHeader }
        );
        if (!detailRes.ok) continue;
        const detail = await detailRes.json();

        const headers = detail.payload?.headers || [];
        const subjectHeader = headers.find((h: any) => h.name === "Subject");
        const subject = subjectHeader?.value || "Inbox Task";

        const emailDate = new Date(parseInt(detail.internalDate, 10)).toISOString();
        const title = `📧 ${subject}`;
        const key = `${title}|${new Date(emailDate).getTime()}`;
        if (seen.has(key)) continue;
        seen.add(key);

        rows.push({
          user_id: currentUserId,
          title,
          start_time: emailDate,
          end_time: emailDate,
          location: "Gmail Inbox",
        });
      }

      if (rows.length === 0) {
        Alert.alert("Gmail Sync", "Everything is already synced.");
        return;
      }

      const { error: insertError } = await supabase.from("Calendar_Event").insert(rows);
      if (insertError) throw insertError;

      Alert.alert("Success", `${rows.length} email(s) synced to your calendar.`);
      await fetchUserAndEvents();
    } catch (error: any) {
      console.error("Gmail sync error:", error);
      Alert.alert("Sync Failed", error.message || "Could not parse emails.");
    } finally {
      setIsSyncing(false);
    }
  };

  // calendar marks

  const markedDates = Object.keys(events).reduce((acc, date) => {
    if (events[date].length > 0) acc[date] = { marked: true, dotColor: "#007AFF" };
    return acc;
  }, {} as any);

  markedDates[selectedDate] = {
    ...(markedDates[selectedDate] || {}),
    selected: true,
    selectedColor: "#007AFF",
  };

  const currentEvents = events[selectedDate] || [];

  // form helpers

  const resetForm = () => {
    setNewTitle("");
    setNewStartTime("");
    setNewEndTime("");
    setNewLocation("");
    setNewDescription("");
    setEditingId(null);
    setEditingDate("");
  };

  //add event

  const handleAddEvent = async () => {
    if (!newTitle.trim()) return;

    if (!currentUserId) {
      Alert.alert("Authentication Error", "You must be logged in to save events.");
      return;
    }

    const start = buildTimestamp(selectedDate, newStartTime);
    const end = buildTimestamp(selectedDate, newEndTime || newStartTime);
    if (!start || !end) {
      Alert.alert("Invalid time", "Use a format like 8:00 AM or 14:30.");
      return;
    }

    const newEvent = {
      user_id: currentUserId,
      title: newTitle.trim(),
      start_time: start,
      end_time: end,
      location: newLocation.trim() ? newLocation.trim() : null,
      description: newDescription.trim() ? newDescription.trim() : null,
    };

    try {
      const { data, error } = await supabase
        .from("Calendar_Event")
        .insert([newEvent])
        .select("*");

      if (error) throw error;

      if (data && data.length > 0) {
        const insertedEvent: EventItem = data[0];
        setEvents((prev) => ({
          ...prev,
          [selectedDate]: [...(prev[selectedDate] || []), insertedEvent],
        }));
      }

      resetForm();
    } catch (error: any) {
      console.error("Error inserting event:", error.message);
      Alert.alert("Save Failed", "Could not save the event to the database.");
    }
  };

  // edit event

  const startEdit = (event: EventItem) => {
    const sameTime = event.end_time === event.start_time;
    setEditingId(event.event_id);
    setEditingDate(eventDateKey(event.start_time));
    setNewTitle(event.title);
    setNewStartTime(formatTime(event.start_time));
    setNewEndTime(sameTime ? "" : formatTime(event.end_time));
    setNewLocation(event.location ?? "");
    setNewDescription(event.description ?? "");
  };

  const handleUpdateEvent = async () => {
    if (editingId === null) return;
    if (!newTitle.trim()) {
      Alert.alert("Missing title", "Give the event a title.");
      return;
    }

    // the event stays on the day it was created for
    const start = buildTimestamp(editingDate, newStartTime);
    const end = buildTimestamp(editingDate, newEndTime || newStartTime);
    if (!start || !end) {
      Alert.alert("Invalid time", "Use a format like 8:00 AM or 14:30.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("Calendar_Event")
        .update({
          title: newTitle.trim(),
          start_time: start,
          end_time: end,
          location: newLocation.trim() ? newLocation.trim() : null,
          description: newDescription.trim() ? newDescription.trim() :null,
        })
        .eq("event_id", editingId)
        .select("*");

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Event was not updated. Check your row-level security policy.");

      const updated: EventItem = data[0];
      setEvents((prev) => ({
        ...prev,
        [editingDate]: (prev[editingDate] || []).map((e) => (e.event_id === editingId ? updated : e)),
      }));

      resetForm();
    } catch (error: any) {
      console.error("Error updating event:", error.message);
      Alert.alert("Update Failed", error.message || "Could not update the event.");
    }
  };

  // delete event 

  const deleteEvent = async (event: EventItem) => {
    try {
      const { error } = await supabase
        .from("Calendar_Event")
        .delete()
        .eq("event_id", event.event_id);

      if (error) throw error;

      const key = eventDateKey(event.start_time);
      setEvents((prev) => ({
        ...prev,
        [key]: (prev[key] || []).filter((e) => e.event_id !== event.event_id),
      }));

      // if the deleted event was being edited, close the form
      if (editingId === event.event_id) resetForm();
    } catch (error: any) {
      console.error("Error deleting event:", error.message);
      Alert.alert("Delete Failed", error.message || "Could not delete the event.");
    }
  };

  const handleDeletePress = (event: EventItem) => {
    confirmDelete("Delete event", `Delete "${event.title}"?`, () => deleteEvent(event));
  };


  const isEditing = editingId !== null;

  return (
    <View style={styles.container}>
      <Calendar
        current={selectedDate}
        onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        theme={{
          todayTextColor: "#007AFF",
          selectedDayBackgroundColor: "#007AFF",
          arrowColor: "#007AFF",
        }}
      />

      {/*Gmail syncing */}
      <TouchableOpacity
        style={[styles.button, styles.syncButton, isSyncing && styles.buttonDisabled]}
        onPress={handleGmailSync}
        disabled={isSyncing}
      >
        <Text style={styles.buttonText}>{isSyncing ? "Syncing..." : "Sync Unread Gmail to Calendar"}</Text>
      </TouchableOpacity>

      <View style={styles.eventSection}>
        <Text style={styles.headerTitle}>Events for {selectedDate}</Text>
        {currentEvents.length > 0 ? (
          currentEvents.map((event, index) => {
            const start = formatTime(event.start_time);
            const end = event.end_time !== event.start_time ? formatTime(event.end_time) : "";
            const beingEdited = editingId === event.event_id;
            return (
              <View
                key={event.event_id ?? index.toString()}
                style={[styles.eventCard, beingEdited && styles.eventCardEditing]}
              >
                <View style={styles.eventRow}>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    {start ? <Text style={styles.timeText}>{end ? `${start} – ${end}` : start}</Text> : null}
                    {event.location ? <Text style={styles.locationText}>@ {event.location}</Text> : null}
                    {event.description ? <Text style={styles.descriptText}>@ {event.description}</Text> : null}
                  </View>
                  <View style={styles.actionRow}>
                    <TouchableOpacity onPress={() => startEdit(event)} style={styles.actionButton}>
                      <Text style={styles.editText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeletePress(event)} style={styles.actionButton}>
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.noEventText}>No events scheduled for this day.</Text>
        )}
      </View>

      {/* Add / Edit Event Form */}
      <View style={styles.formContainer}>
        <Text style={styles.formHeader}>
          {isEditing ? `Editing event on ${editingDate}` : "Add an Event to the Selected Date"}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Event Title:"
          placeholderTextColor="#888"
          value={newTitle}
          onChangeText={setNewTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Start Time (e.g. 8:00 AM)"
          placeholderTextColor="#888"
          value={newStartTime}
          onChangeText={setNewStartTime}
        />
        <TextInput
          style={styles.input}
          placeholder="End Time (e.g. 12:00 PM)"
          placeholderTextColor="#888"
          value={newEndTime}
          onChangeText={setNewEndTime}
        />
        <TextInput
          style={styles.input}
          placeholder="Location (Optional)"
          placeholderTextColor="#888"
          value={newLocation}
          onChangeText={setNewLocation}
        />
        <TextInput
          style={[styles.input, styles.multline]}
          placeholder="Description (Optional)"
          placeholderTextColor="#888"
          value={newDescription}
          onChangeText={setNewDescription}
        />
        <TouchableOpacity style={styles.button} onPress={isEditing ? handleUpdateEvent : handleAddEvent}>
          <Text style={styles.buttonText}>{isEditing ? "Save Changes" : "Add Event"}</Text>
        </TouchableOpacity>
        {isEditing ? (
          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={resetForm}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginVertical: 5,
  },
  eventSection: {
    marginTop: 10,
    borderTopWidth: 2,
    borderTopColor: "black",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "black",
  },
  eventCard: {
    backgroundColor: "#fff",
    borderTopColor: "black",
    borderTopWidth: 1,
    borderRadius: 2,
    marginVertical: 2,
    paddingVertical: 4,
  },
  eventCardEditing: {
    backgroundColor: "#eef6ff",
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  eventInfo: {
    flex: 1,
    paddingRight: 8,
  },
  actionRow: {
    flexDirection: "row",
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#007AFF",
  },
  deleteText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#d11a2a",
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "black",
  },
  noEventText: {
    fontSize: 14,
    color: "black",
    fontStyle: "italic",
  },
  timeText: {
    fontSize: 12,
    color: "black",
  },
  locationText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "black",
  },
  descriptText: {
    fontSize: 12,
    color: 'black',
  },
  multline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formContainer: {
    marginTop: 10,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "black",
  },
  formHeader: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    color: "black",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 4,
    fontSize: 14,
    marginBottom: 8,
    color: "black",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  syncButton: {
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: "#eee",
    marginTop: 8,
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "bold",
    fontSize: 14,
  },
});
