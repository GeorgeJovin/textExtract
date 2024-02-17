import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Entypo } from "@expo/vector-icons";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { app } from "../database/firebase";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome5 } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as FileSystem from "expo-file-system";
import { printToFileAsync } from "expo-print";
import { shareAsync } from "expo-sharing";
import { BackHandler } from "react-native";
import { Audio } from 'expo-av';

const auth = getAuth( app );

export default function HomeScreen() {
  const navigation = useNavigation();
  const [user, setUser] = useState( null );
  const [speechAudioUrl, setSpeechAudioUrl] = useState( null );
  const [capturedImage, setCapturedImage] = useState();
  const [lang, setLang] = useState( "eng" );
  const [ocrResult, setOcrResult] = useState( "" );
  const [isLoading, setIsLoading] = useState( false );
  const [sound, setSound] = useState();

  useEffect( () => {
    const backAction = () => {
      if ( navigation.isFocused() && navigation.canGoBack() ) {
        navigation.navigate( "Home" );
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [navigation] );
  useEffect( () => {
    const unsubscribe = onAuthStateChanged( auth, ( userData ) => {
      if ( userData ) {
        setUser( userData );
      } else {
        setUser( null );
      }
    } );
    return () => {
      unsubscribe();
    };
  }, [] );
  const convertToSpeech = async () => {
    setIsLoading( true );

    const url = 'https://cloudlabs-text-to-speech.p.rapidapi.com/synthesize';
    const options = {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'X-RapidAPI-Key': '89a3561559mshd5ad68b47444c51p1b2d8ejsn279396f0a43f',
        'X-RapidAPI-Host': 'cloudlabs-text-to-speech.p.rapidapi.com'
      },
      body: new URLSearchParams( {
        voice_code: 'en-US-1',
        text: ocrResult,
        speed: '1.00',
        pitch: '1.00',
        output_type: 'audio_url'
      } ).toString()
    };

    try {
      const response = await fetch( url, options );
      const data = await response.json();
      console.log( data );
      if ( data ) {

        console.log( 'hlo', data?.result?.audio_url );
        setSpeechAudioUrl( data?.result?.audio_url );
      } else {
        throw new Error( 'Audio URL not found in the response.' );
      }
    } catch ( error ) {
      console.error( error );
    } finally {
      setIsLoading( false );
    }
  };
  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if ( status !== "granted" ) {
      console.error( "Permission to access camera was denied" );
      return;
    }
    const result = await ImagePicker.launchCameraAsync( {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    } );

    if ( !result.canceled ) {
      setCapturedImage( result.assets[0].uri );
    }
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if ( status !== "granted" ) {
      console.error( "Permission to access media library was denied" );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync( {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    } );
    if ( !result.canceled ) {
      setCapturedImage( result.assets[0].uri );
    }
  };
  const playAudio = async () => {
    if ( speechAudioUrl ) {
      const soundObject = new Audio.Sound();
      try {
        await soundObject.loadAsync( { uri: speechAudioUrl } );
        await soundObject.playAsync();
        setSound( soundObject );
      } catch ( error ) {
        console.log( 'Error playing sound: ', error );
      }
    }
  };

  const Digitalize = async () => {
    if ( !lang ) {
      alert( "Please enter the language for OCR." );
      return;
    }
    if ( !capturedImage ) {
      alert( "Please select an image first." );
      return;
    }
    setIsLoading( true );
    setOcrResult( " " );

    try {
      const base64Data = await FileSystem.readAsStringAsync( capturedImage, {
        encoding: FileSystem.EncodingType.Base64,
      } );
      const apiResponse = await fetch(
        "https://api.onlineocrconverter.com/api/image",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            key: "zz-E94BWsGV4F2PAVMGrCyMDdpheYu-Y75W-5AROj4iEnl8i4-7ISkLoCBMVA9LWVNA",
          },
          body: JSON.stringify( {
            base64: base64Data,
            language: lang,
          } ),
        }
      );

      if ( !apiResponse.ok ) {
        throw new Error( "OCR API request failed." );
      }
      const data = await apiResponse.json();
      setOcrResult( data.text );
      setIsLoading( false );
    } catch ( error ) {
      console.error( "OCR API error:", error );
      setIsLoading( false );
    }
  };

  const handleDownloadPdf = async () => {
    if ( !ocrResult ) {
      alert( "No OCR result to download." );
      return;
    }

    try {
      const htmlContent = `
        <html>
          <head></head>
          <body>
            <div style="text-align: center;">
              <p>${ ocrResult }</p>
            </div>
          </body>
        </html>
      `;

      const file = await printToFileAsync( { html: htmlContent, base64: false } );
      await shareAsync( file.uri );
    } catch ( error ) {
      console.error( "Error generating or sharing the PDF:", error );
    }
  };

  const handleLogout = async () => {
    try {
      await signOut( auth );
      navigation.navigate( "Welcome" );
    } catch ( error ) {
      console.error( "Error signing out:", error );
    }
  };

  return (
    <View style={ { flex: 1, backgroundColor: "#fff" } }>
      <SafeAreaView>
        <ScrollView>
          <View className="flex-row items-center justify-between mt-10">
            <View className="flex-row items-center">
              <View className="m-2">
                <Image
                  source={ require( "../assets/images/profile.png" ) }
                  className="w-10 h-10 rounded-full"
                />
              </View>
              <View>
                { user ? (
                  <Text className="text-lg font-bold">
                    Hello { user.displayName }
                  </Text>
                ) : (
                  <Text>No user signed in</Text>
                ) }
              </View>
            </View>
            <TouchableOpacity onPress={ handleLogout } className="mr-3">
              <MaterialIcons name="logout" size={ 24 } color="black" />
            </TouchableOpacity>
          </View>
          <View className="p-4">
            { capturedImage && (
              <View
                style={ {
                  justifyContent: "center",
                  alignItems: "center",
                  margin: 10,
                } }
              >
                <Image
                  style={ {
                    flex: 1,
                    width: "100%",
                    height: 300,
                    borderRadius: 10,
                  } }
                  resizeMode="contain"
                  source={ { uri: capturedImage } }
                />
              </View>
            ) }

            <View className="flex-row items-center justify-between mt-5">
              <TouchableOpacity
                onPress={ openCamera }
                className="px-8 py-2 bg-blue-500 rounded-xl "
              >
                <Text className="text-xl font-bold text-center text--700">
                  Camera <Entypo name="camera" size={ 24 } color="black" />
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={ openGallery }
                className="px-7 py-2 bg-blue-500 rounded-xl "
              >
                <Text className="text-xl font-bold text-center text--700">
                  Gallery <Entypo name="image" size={ 24 } color="black" />
                </Text>
              </TouchableOpacity>
            </View>

            <View>
              <View>
                <Text className="text-base font-bold mt-5">
                  Select Language
                </Text>
                <Picker
                  selectedValue={ lang }
                  onValueChange={ ( itemValue, itemIndex ) => setLang( itemValue ) }
                  className="bg-gray-200 text-gray-700 rounded mt-3"
                >
                  <Picker.Item label="English" value="eng" />
                  <Picker.Item label="Tamil" value="tam" />
                  <Picker.Item label="Telugu" value="tel" />
                </Picker>
              </View>

              <TouchableOpacity
                onPress={ Digitalize }
                className="bg-blue-500 py-2 rounded-xl mt-5"
              >
                <Text className="text-xl font-bold text-center text--700">
                  Digitalize{ " " }
                  <FontAwesome5 name="digital-ocean" size={ 24 } color="black" />
                </Text>
              </TouchableOpacity>
              { isLoading && (
                <ActivityIndicator
                  size="large"
                  color="#9E9E9E"
                  className="mt-2"
                />
              ) }
              { ocrResult && (
                <>
                  <View
                    className="mt-4"
                    style={ {
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    } }
                  >
                    <Text className="text-center text-gray-700">
                      { ocrResult }
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={ handleDownloadPdf }
                    className="bg-blue-500 py-2 rounded-xl mt-2"
                  >
                    <Text className="text-xl font-bold text-center text--700">
                      Download PDF{ " " }
                      <FontAwesome5 name="file-pdf" size={ 24 } color="black" />
                    </Text>
                  </TouchableOpacity>
                  <View>
                    <TouchableOpacity
                      onPress={ convertToSpeech }
                      className="bg-blue-500 py-2 rounded-xl mt-2"
                    >
                      <Text className="text-xl font-bold text-center text--700">
                        Convert to Speech
                      </Text>
                    </TouchableOpacity>

                    { speechAudioUrl && (
                      <View style={ { marginTop: 20 } }>
                        <Text style={ { fontSize: 18, fontWeight: "bold", marginBottom: 10 } }>
                          Speech Audio:
                        </Text>
                        <TouchableOpacity onPress={ playAudio }>
                          <Text>Play Audio</Text>
                        </TouchableOpacity>
                      </View>
                    ) }
                  </View>

                </>
              ) }
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
