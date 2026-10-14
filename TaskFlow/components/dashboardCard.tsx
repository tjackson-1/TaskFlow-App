import * as React from "react";
import { Header } from "@rneui/themed";

export default function DashboardCard() {
  const handleMenuPress = () => {
    console.log("Menu button pressed.")
  };
  const handleHomePress = () => {
    console.log("Home button pressed.")
  };
  return (
    <Header
      backgroundColor="black"
      barStyle="default"
      centerComponent={{
        text: "TASKFLOW",
        style: { color: "#fff", fontWeight: "bold" }
      }}
      containerStyle={{ width: '100%' }}
      leftComponent={{
        icon: "menu",
        color: "#fff",
        onPress: () => console.log('Menu pressed')
      }}
      rightComponent={{
        icon: "home",
        color: "#fff",
        onPress: () => console.log('Home pressed')
      }}
      placement="center"
    />
  );
}