import React, { useState } from "react";
import { LayoutAnimation, StyleSheet, Text, TouchableOpacity, View } from "react-native";
 
type Props = {
  title: string;
  defaultCollapsed?: boolean;
  children: React.ReactNode;
};
 
export default function CollapsibleSection({ title, defaultCollapsed = false, children }: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
 
  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsed((c) => !c);
  };
 
  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: !collapsed }}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.chevron}>{collapsed ? "▸" : "▾"}</Text>
      </TouchableOpacity>
 
      {/* kept so unsaved drawings / unsaved text arent lost */}
      <View style={collapsed ? styles.hidden : undefined}>{children}</View>
    </View>
  );
}
 
const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 6,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#eee",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "black",
  },
  chevron: {
    fontSize: 16,
    color: "#555",
  },
  hidden: {
    display: "none",
  },
});
 