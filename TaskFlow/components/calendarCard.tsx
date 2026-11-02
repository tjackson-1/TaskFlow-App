import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from "react-native";
import { Calendar, /*CalendarList, Agenda*/ } from "react-native-calendars";
import { supabase } from "../utils/supabase";

interface EventItem{
    event_id: number;
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    location?: string;
}

export default function CalendarCard(){
    

  //   //mock event data
  //   const [events, setEvents] = useState<{ [key: string]: EventItem[] }> ({
  //   '2026-10-07': [
  //     { id: '1', title: 'Sprint 1 Review', date: '2026-10-07', startTime: '12:30 PM', endTime: '1:45 PM', location: 'ATHS E200' },
  //   ]
  // });
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]); //UTC time

  //store events for logged in users
  const [events, setEvents] = useState<{ [key:string]: EventItem[] }>({});
  const [currentUserId, setCurrentUserId] = useState<number | null>(null); 

  //states for making new events
  const [newTitle, setNewTitle] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [newLocation, setNewLocation] = useState('');

  useEffect(() => {
    fetchUserAndEvents();
    }, []);

    const fetchUserAndEvents = async () => {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session?.user) {
              console.log("No user logged in");
              return;
            }

            const authUuid = session.user.id;

            // 1. Fetch the integer user_id from your User table (created automatically by the trigger)
            const { data: userRows, error: userError } = await supabase
              .from('User')
              .select('user_id')
              .eq('supabase_uid', authUuid)
              .limit(1);

            if (userError || !userRows || userRows.length === 0) {
              console.error('Error fetching user mapping:', userError?.message);
              Alert.alert('Database Error', 'No public user profile found. Try signing out and signing back in.');
              return;
            }

            // 2. Set currentUserId to the integer user_id
            setCurrentUserId(userRows[0].user_id);

            // 3. Fetch events
            const { data, error } = await supabase
              .from('Calendar_Event')
              .select('*');

            if (error) {
              console.error('Error fetching events:', error.message);
              return;
            }

            if (!data) return;

            const formattedEvents: { [key: string]: EventItem[] } = {};
            data.forEach((item: any) => {
              const eventDate = item.start_time ? item.start_time?.split('T')[0] : selectedDate;
              if (!formattedEvents[eventDate]) {
                formattedEvents[eventDate] = [];
              }
              formattedEvents[eventDate].push(item);
          });
          setEvents(formattedEvents);
        } catch (err) {
            console.error('Unexpected error loading user events:', err);
        }
    };
 
  //generates marked dates based on event states
  const markedDates = Object.keys(events).reduce((acc, date) => {
    acc[date] = { marked: true, dotColor: '#007AFF' };
    return acc;
    }, {} as any);

  markedDates[selectedDate] = {
    ...(markedDates[selectedDate] || {}),
    selected: true,
    selectedColor: '#007AFF',
  };

  const currentEvents = events[selectedDate] || [];

  //adding new events
  const handleAddEvent = async () => {
    if (!newTitle.trim()) return;

    if (!currentUserId) {
      Alert.alert('Authentication Error', 'You must be logged in to save events.');
      return;
    }

    const newEvent  = {
        user_id: currentUserId, //changed from event_id to match user_id column
        title: newTitle.trim(),
        start_time: selectedDate,
        end_time: selectedDate,
        location: newLocation.trim() ? newLocation.trim() : undefined,
    };

    try {
      const { data, error } = await supabase
          .from('Calendar_Event')
          .insert([newEvent])
          .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
          const insertedEvent: EventItem = {
              ...data[0],
              date: selectedDate,
          };

          setEvents((prevEvents) => {
              const dayEvents = prevEvents[selectedDate] || [];
              return {
                  ...prevEvents,
                  [selectedDate]: [...dayEvents, insertedEvent],
              };
          });
      }

      // resetting fields
      setNewTitle('');
      setNewStartTime('');
      setNewEndTime('');
      setNewLocation('');
  } catch (error: any) {
      console.error('Error inserting event:', error.message);
      Alert.alert('Save Failed', 'Could not save the event to the database.');
  }
};

  return (
    <View style={styles.container}>
      <Calendar
        current={selectedDate}
        onDayPress={(day: { dateString: React.SetStateAction<string>; }) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        theme={{
          todayTextColor: '#007AFF',
          selectedDayBackgroundColor: '#007AFF',
          arrowColor: '#007AFF',
        }}
      />

      <View style={styles.eventSection}>
        <Text style={styles.headerTitle}>Events for {selectedDate}</Text>
        {currentEvents.length > 0 ? (
          currentEvents.map((event, index) => (
            <View key={event.event_id || index.toString()} style={styles.eventCard}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.timeText}>{event.start_time}  {event.end_time}</Text>
              {event.location ? <Text style={styles.locationText}>@ {event.location}</Text> : null}
            </View>
          ))
        ) : (
          <Text style={styles.noEventText}>No events scheduled for this day.</Text>
        )}
      </View>
        {/*Adding Event Form*/}
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
});