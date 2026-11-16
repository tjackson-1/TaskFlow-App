import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from "react-native";
import { Calendar, DateData, /*CalendarList, Agenda*/ } from "react-native-calendars";
import { supabase } from "../utils/supabase";

interface EventItem{
    event_id: number;
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    location?: string;
}

const toLocalDateString = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Works for both "2026-11-09" and full ISO timestamps
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

// makes an ISO timestamp for the selected day at the given time (blank = start of day)
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

export default function CalendarCard() {
  const [selectedDate, setSelectedDate] = useState(toLocalDateString(new Date()));

  const [events, setEvents] = useState<{ [key: string]: EventItem[] }>({});
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [newLocation, setNewLocation] = useState("");


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

  // ---------- Gmail sync ----------

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

  // ---------- calendar marks ----------

  const markedDates = Object.keys(events).reduce((acc, date) => {
    acc[date] = { marked: true, dotColor: "#007AFF" };
    return acc;
  }, {} as any);

  markedDates[selectedDate] = {
    ...(markedDates[selectedDate] || {}),
    selected: true,
    selectedColor: "#007AFF",
  };

  const currentEvents = events[selectedDate] || [];

  // ---------- add event ----------

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

      setNewTitle("");
      setNewStartTime("");
      setNewEndTime("");
      setNewLocation("");
    } catch (error: any) {
      console.error("Error inserting event:", error.message);
      Alert.alert("Save Failed", "Could not save the event to the database.");
    }
  };

  return (
    <View style={styles.container}>
      <Calendar
        current={selectedDate}
        onDayPress={(day: DateData ) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        theme={{
          todayTextColor: '#007AFF',
          selectedDayBackgroundColor: '#007AFF',
          arrowColor: '#007AFF',
        }}
      />

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
            return (
              <View key={event.event_id ?? index.toString()} style={styles.eventCard}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                {start ? <Text style={styles.timeText}>{end ? `${start} – ${end}` : start}</Text> : null}
                {event.location ? <Text style={styles.locationText}>@ {event.location}</Text> : null}
              </View>
            );
          })
        ) : (
          <Text style={styles.noEventText}>No events scheduled for this day.</Text>
        )}
      </View>

      {/* Adding event form */}
      <View style={styles.formContainer}>
        <Text style={styles.formHeader}>Add an Event to the Selected Date</Text>
        <TextInput style={styles.input} 
          placeholder="Event Title:" 
          placeholderTextColor='#888' 
          value={newTitle} 
          onChangeText={setNewTitle} 
        />
        <TextInput style={styles.input}
          placeholder="Start Time (e.g. 8:00 AM)" 
          placeholderTextColor='#888' 
          value={newStartTime} 
          onChangeText={setNewStartTime} 
        />
        <TextInput style={styles.input}
          placeholder="End Time (e.g. 12:00 PM)" 
          placeholderTextColor='#888' 
          value={newEndTime} 
          onChangeText={setNewEndTime} 
        />
        <TextInput style={styles.input} 
          placeholder="Location (Optional)" 
          placeholderTextColor='#888' 
          value={newLocation} 
          onChangeText={setNewLocation} 
        />
        <TouchableOpacity style={styles.button} onPress={handleAddEvent}>
          <Text style={styles.buttonText}>Add Event</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};




const styles = StyleSheet.create({
  container: {
    backgroundColor: '000',
    borderRadius: 12,
    padding: 20,
    marginVertical: 5
  },
  eventSection: {
    marginTop: 10,
    borderTopWidth: 2,
    borderTopColor: 'black'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'black'
  },
  eventCard: {
    backgroundColor: '#fff',
    borderTopColor: 'black',
    borderTopWidth: 1,
    borderRadius: 2,
    marginVertical: 2
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: 'black'
  },
  description: {
    fontSize: 13,
    color: 'black'
  },
  noEventText: {
    fontSize: 14,
    color: 'black',
    fontStyle: 'italic'
  },
  timeText: {
    fontSize: 12,
    color: 'black'
  },
  locationText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'black'
  },
  formContainer: {
    marginTop: 10,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'black'
  }, 
  formHeader:{
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    color: 'black',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 4,
    fontSize: 14,
    marginBottom: 8,
    color: 'black',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  syncButton: {
    marginTop: 10
  },
  buttonDisabled: {
    opacity: 0.6
  }
});