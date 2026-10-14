import React, {useState} from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from "react-native";
import { Calendar, /*CalendarList, Agenda*/ } from "react-native-calendars";

interface EventItem{
    id: string;
    title: string;
    description?: string;
    date: string; //YYYY-MM-DD format, add to db as well
    startTime: string;
    endTime: string;
    location?: string;
}

export default function CalendarCard(){
    const [selectedDate, setSelectedDate] = useState(
      new Date().toISOString().split('T')[0]); //UTC time

    //mock event data
    const [events, setEvents] = useState<{ [key: string]: EventItem[] }> ({
    '2026-10-07': [
      { id: '1', title: 'Sprint 1 Review', date: '2026-10-07', startTime: '12:30 PM', endTime: '1:45 PM', location: 'ATHS E200' },
    ]
  });

  //states for making new events
  const [newTitle, setNewTitle] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [newLocation, setNewLocation] = useState('');
 
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
  const handleAddEvent = () => {
    if (!newTitle.trim()) return;

    const newEvent : EventItem = {
        id: Date.now().toString(),
        title: newTitle,
        date: selectedDate,
        startTime: newStartTime,
        endTime: newEndTime,
        location: newLocation.trim() ? newLocation : undefined,
    };

    setEvents((prevEvents) => {
        const dayEvents = prevEvents[selectedDate] || [];
        return {
            ...prevEvents,
            [selectedDate]: [...dayEvents, newEvent],
        };
    });

    //resetting fields
    setNewTitle('');
    setNewLocation('');
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
          currentEvents.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.timeText}>{event.startTime} - {event.endTime}</Text>
              {event.location ? <Text style={styles.locationText}>@ {event.location}</Text> : null}
            </View>
          ))
        ) : (
          <Text style={styles.noEventText}>No events scheduled for this day.</Text>
        )}
      </View>
        //Adding Event Form
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