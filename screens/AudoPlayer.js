import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Audio } from "expo-av";
import { FontAwesome5 } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";

export default function AudioPlayer({ audioUrl }) {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    if (audioUrl) {
      loadSound();
    }

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    const updatePosition = async () => {
      if (sound && isPlaying) {
        const { positionMillis } = await sound.getStatusAsync();
        setPosition(positionMillis);
      }
    };

    const interval = setInterval(updatePosition, 100); // Update every 100 milliseconds

    return () => clearInterval(interval);
  }, [sound, isPlaying]);

  const loadSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: false }
      );
      setSound(sound);
      const { durationMillis } = await sound.getStatusAsync();
      setDuration(durationMillis);
    } catch (error) {
      console.error("Error loading audio", error);
    }
  };

  const togglePlayback = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const onSliderValueChange = async (value) => {
    if (sound) {
      await sound.setPositionAsync(value);
      setPosition(value); // Update position immediately when user changes it
    }
  };

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={togglePlayback}>
          <FontAwesome5
            name={isPlaying ? "pause-circle" : "play-circle"}
            size={32}
            color="black"
          />
        </TouchableOpacity>
        <Slider
          style={{ width: 200, height: 40 }}
          minimumValue={0}
          maximumValue={duration}
          value={position}
          onValueChange={onSliderValueChange}
          disabled={!sound}
        />
        <Text>{formatTime(duration)}</Text>
      </View>
    </View>
  );
}
