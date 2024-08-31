import React, { useState, useEffect } from 'react';
import { Text, SafeAreaView, TextInput, View, Button, Image, Alert, FlatList, TouchableOpacity } from 'react-native';
import SQLite from 'react-native-sqlite-storage';

// Open or create a SQLite database
const db = SQLite.openDatabase(
  {
    name: 'urlHistory.db',
    location: 'default',
  },
  () => { console.log('Database opened'); },
  error => { console.log('Error opening database:', error); }
);

const ImageFetch = () => {
  const [url, setURL] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [urlHistory, setUrlHistory] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  useEffect(() => {
    // Create a table to store URLs if it doesn't exist
    db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS url_history (id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT);',
        [],
        () => console.log('Table created or already exists'),
        error => console.log('Error creating table:', error)
      );
    });

    // Load URL history from the database
    loadUrlHistory();
  }, []);

  const loadUrlHistory = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT url FROM url_history ORDER BY id DESC;',
        [],
        (tx, results) => {
          let urls: string[] = [];
          for (let i = 0; i < results.rows.length; i++) {
            urls.push(results.rows.item(i).url);
          }
          setUrlHistory(urls);
        },
        error => console.log('Error loading URL history:', error)
      );
    });
  };

  const handlePress = (): void => {
    if (url.trim() === '') {
      Alert.alert('Invalid URL', 'Please enter a valid URL.');
      return;
    }
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'http://' + formattedUrl;
    }
    const newImageUrl = `${formattedUrl}?timestamp=${new Date().getTime()}`;
    setImageUrl(newImageUrl); // Set the URL with a timestamp to bypass cache

    // Save the URL to the history
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO url_history (url) VALUES (?);',
        [formattedUrl],
        () => console.log('URL saved to history'),
        error => console.log('Error saving URL to history:', error)
      );
    });

    setShowSuggestions(false); // Hide suggestions after selecting a URL
    loadUrlHistory(); // Reload URL history after adding a new entry
  };

  const handleCloseImage = (): void => {
    setImageUrl(null);
    setURL('');
  };

  const handleURLChange = (text: string) => {
    setURL(text);
    setShowSuggestions(text.length > 0); // Show suggestions only when there's input
  };

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
      <Text style={{ fontSize: 18, marginBottom: 8 }}>Enter URL to fetch image:</Text>
      <TextInput
        style={{
          height: 40,
          borderColor: 'gray',
          borderWidth: 1,
          paddingHorizontal: 8,
        }}
        placeholder="Enter URL here"
        onChangeText={handleURLChange}
        value={url}
        keyboardType="url"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {showSuggestions && (
        <FlatList
          data={urlHistory.filter(item => item.includes(url))}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setURL(item)}>
              <Text style={{ padding: 8, borderBottomColor: 'gray', borderBottomWidth: 1 }}>{item}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item, index) => index.toString()}
          style={{ maxHeight: 150, marginTop: 8, borderColor: 'gray', borderWidth: 1 }}
        />
      )}
      <View style={{ marginTop: 16 }}>
        <Button title="Open Image" onPress={handlePress} />
      </View>
      {imageUrl && (
        <View>
          <Image
            source={{ uri: imageUrl, cache:'reload' }}
            style={{
              width: '100%',
              height: 400,
              marginTop: 20,
              borderColor: 'black',
              borderWidth: 3,
            }}
            resizeMode="contain"
            onError={() => {
              Alert.alert('Error', 'Failed to load image.');
              setImageUrl(null); // Reset the image URL if loading fails
            }}
          />
          <View style={{ marginTop: 16 }}>
            <Button title="Close Image" onPress={handleCloseImage} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default ImageFetch;
