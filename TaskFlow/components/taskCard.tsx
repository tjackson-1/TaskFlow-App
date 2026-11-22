import React, { useCallback, useEffect, useState } from "react";
import {
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    View,
    Text,
} from "react-native";
import { supabase } from "../utils/supabase";

export interface TaskItem {
    task_id: number,
    user_id: number;
    title: string;
    description?: string | null;
    due_date: string; //yyyy-mm-dd
    status: string; //todo / done
    priority: string; //low - med - high
}

type Props = {
    onTasksChange?: (tasks: TaskItem[]) => void;
};
 
const PRIORITIES = ["low", "medium", "high"];
  
const toLocalDateString = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
 
// rejects wrong dates, or else true
const isValidDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
};
 
// tasks first, then due date
const sortTasks = (list: TaskItem[]) =>
  [...list].sort((a, b) => {
    if (a.status !== b.status) return a.status === "done" ? 1 : -1;
    return a.due_date.localeCompare(b.due_date);
  });
 
export default function TaskCard({ onTasksChange }: Props) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
 
  // form (adding / editing)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(toLocalDateString(new Date()));
  const [priority, setPriority] = useState("medium");
  const [editingId, setEditingId] = useState<number | null>(null);
 
 
  const fetchTasks = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) return;
 
      const { data: userRows, error: userError } = await supabase
        .from("User")
        .select("user_id")
        .eq("supabase_uid", session.user.id)
        .limit(1);
 
      if (userError || !userRows || userRows.length === 0) {
        console.error("Error fetching user mapping:", userError?.message);
        return;
      }
 
      const userId = userRows[0].user_id;
      setCurrentUserId(userId);
 
      const { data, error } = await supabase
        .from("Task")
        .select("*")
        .eq("user_id", userId);
 
      if (error) {
        console.error("Error fetching tasks:", error.message);
        return;
      }
      setTasks(sortTasks((data as TaskItem[]) || []));
    } catch (err) {
      console.error("Unexpected error loading tasks:", err);
    }
  }, []);
 
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);
 
  // list changes
  useEffect(() => {
    onTasksChange?.(tasks);
  }, [tasks]);
 
 
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate(toLocalDateString(new Date()));
    setPriority("medium");
    setEditingId(null);
  };
 
  const startEdit = (task: TaskItem) => {
    setEditingId(task.task_id);
    setTitle(task.title);
    setDescription(task.description ?? "");
    setDueDate(task.due_date);
    setPriority(task.priority || "medium");
  };
 
  //update
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Missing title", "Give the task a title.");
      return;
    }
    if (!isValidDate(dueDate.trim())) {
      Alert.alert("Invalid date", "Use the format YYYY-MM-DD, for example 2026-12-01.");
      return;
    }
    if (!currentUserId) {
      Alert.alert("Authentication Error", "You must be logged in to save tasks.");
      return;
    }
 
    const fields = {
      title: title.trim(),
      description: description.trim() ? description.trim() : null,
      due_date: dueDate.trim(),
      priority,
    };
 
    try {
      if (editingId === null) {
        const { data, error } = await supabase
          .from("Task")
          .insert([{ ...fields, user_id: currentUserId, status: "todo" }])
          .select("*");
        if (error) throw error;
        if (data && data.length > 0) {
          setTasks((prev) => sortTasks([...prev, data[0] as TaskItem]));
        }
      } else {
        const { data, error } = await supabase
          .from("Task")
          .update(fields)
          .eq("task_id", editingId)
          .select("*");
        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error("Task was not updated. Check your row-level security policy.");
        }
        setTasks((prev) =>
          sortTasks(prev.map((t) => (t.task_id === editingId ? (data[0] as TaskItem) : t)))
        );
      }
      resetForm();
    } catch (error: any) {
      console.error("Error saving task:", error.message);
      Alert.alert("Save Failed", error.message || "Could not save the task.");
    }
  };
 
  //done
  const toggleDone = async (task: TaskItem) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    try {
      const { data, error } = await supabase
        .from("Task")
        .update({ status: newStatus })
        .eq("task_id", task.task_id)
        .select("*");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Task was not updated.");
      setTasks((prev) =>
        sortTasks(prev.map((t) => (t.task_id === task.task_id ? (data[0] as TaskItem) : t)))
      );
    } catch (error: any) {
      console.error("Error updating task:", error.message);
      Alert.alert("Update Failed", error.message || "Could not update the task.");
    }
  };
 
  //delete
 
  const deleteTask = async (task: TaskItem) => {
    try {
      const { error } = await supabase.from("Task").delete().eq("task_id", task.task_id);
      if (error) throw error;
      setTasks((prev) => prev.filter((t) => t.task_id !== task.task_id));
      if (editingId === task.task_id) resetForm();
    } catch (error: any) {
      console.error("Error deleting task:", error.message);
      Alert.alert("Delete Failed", error.message || "Could not delete the task.");
    }
  };
 
  const handleDeletePress = (task: TaskItem) => {
    Alert.alert("Delete task", `Delete "${task.title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTask(task) },
    ]);
  };
  
  const today = toLocalDateString(new Date());
  const isEditing = editingId !== null;
 
  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Tasks</Text>
 
      {tasks.length === 0 ? (
        <Text style={styles.emptyText}>No tasks yet. Add one below.</Text>
      ) : (
        tasks.map((task) => {
          const done = task.status === "done";
          const overdue = !done && task.due_date < today;
          const beingEdited = editingId === task.task_id;
          return (
            <View key={task.task_id} style={[styles.taskRow, beingEdited && styles.taskRowEditing]}>
              <TouchableOpacity onPress={() => toggleDone(task)} style={styles.checkButton}>
                <Text style={styles.checkText}>{done ? "☑" : "☐"}</Text>
              </TouchableOpacity>
 
              <View style={styles.taskInfo}>
                <Text style={[styles.taskTitle, done && styles.taskTitleDone]}>{task.title}</Text>
                {task.description ? (
                  <Text style={styles.taskDescription} numberOfLines={2}>
                    {task.description}
                  </Text>
                ) : null}
                <Text style={[styles.taskMeta, overdue && styles.taskOverdue]}>
                  Due {task.due_date}
                  {overdue ? " (overdue)" : ""} · {task.priority}
                </Text>
              </View>
 
              <View style={styles.actionColumn}>
                <TouchableOpacity onPress={() => startEdit(task)} style={styles.actionButton}>
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeletePress(task)} style={styles.actionButton}>
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
 
      {/* Add / Edit form */}
      <View style={styles.formContainer}>
        <Text style={styles.formHeader}>{isEditing ? "Edit Task" : "Add a Task"}</Text>
        <TextInput
          style={styles.input}
          placeholder="Task title"
          placeholderTextColor="#888"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Description (optional)"
          placeholderTextColor="#888"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <TextInput
          style={styles.input}
          placeholder="Due date (YYYY-MM-DD)"
          placeholderTextColor="#888"
          value={dueDate}
          onChangeText={setDueDate}
          autoCapitalize="none"
        />
 
        <View style={styles.priorityRow}>
          {PRIORITIES.map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPriority(p)}
              style={[styles.priorityChip, priority === p && styles.priorityChipActive]}
            >
              <Text style={[styles.priorityText, priority === p && styles.priorityTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
 
        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>{isEditing ? "Save Changes" : "Add Task"}</Text>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "black",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: "black",
    fontStyle: "italic",
    marginBottom: 8,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingVertical: 8,
  },
  taskRowEditing: {
    backgroundColor: "#eee",
  },
  checkButton: {
    paddingRight: 10,
    paddingTop: 2,
  },
  checkText: {
    fontSize: 22,
    color: "#007AFF",
  },
  taskInfo: {
    flex: 1,
    paddingRight: 8,
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "black",
  },
  taskTitleDone: {
    textDecorationLine: "line-through",
    color: "#888",
  },
  taskDescription: {
    fontSize: 13,
    color: "#444",
    marginTop: 2,
  },
  taskMeta: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  taskOverdue: {
    color: "#e12030",
    fontWeight: "600",
  },
  actionColumn: {
    alignItems: "flex-end",
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
  formContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "black",
  },
  formHeader: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    color: "black",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 6,
    fontSize: 14,
    marginBottom: 8,
    color: "black",
  },
  multiline: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  priorityRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  priorityChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 8,
  },
  priorityChipActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  priorityText: {
    fontSize: 13,
    color: "#333",
  },
  priorityTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
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
 