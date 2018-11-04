import React from 'react';
import { AppRegistry, StyleSheet, View, TextInput, Modal, Image } from 'react-native';
import Toast from 'react-native-easy-toast';
import {  Button, Text, List, ListItem, Icon } from 'react-native-elements';
import { Location, Permissions } from 'expo';

import * as firebase from 'firebase';

const firebaseConfig = {
    apiKey: "AIzaSyAlqehP9XgJklN8ChRbAShB3xhN4G3Eq78",
    authDomain: "benproject-2e82e.firebaseapp.com",
    databaseURL: "https://benproject-2e82e.firebaseio.com",
    storageBucket: "benproject-2e82e.appspot.com"
};

const firebaseApp = firebase.initializeApp(firebaseConfig);

export default class Home extends React.Component {
    static navigationOptions = { title: 'Home' };

    constructor(props) {
        super(props);
        this.addressesRef = firebaseApp.database().ref('addresses');
        this.weatherRef = firebaseApp.database().ref('weather');
        this.state = {
            address: '',
            name: '',
            location: {},
            addresses: [],
            weather: {},
            modalVisible: false
        };
    }

    componentDidMount() {
        this.listenForAddress(this.addressesRef);
        this.getLocation();
    }

    getLocation = async () => {
        //Check permission
        let { status } = await Permissions.askAsync(Permissions.LOCATION);
        if (status !== 'granted') {
            Alert.alert('No permission to access location');
        }
        else {
            const APIKEY = 'c76ad520e3b298ae1650c9d7d259ead7'
            let location = await Location.getCurrentPositionAsync({ enableHighAccuracy: true });
            await this.setState({ location });
            await this.setState({
                location: {
                    long: this.state.location.coords.longitude,
                    lat: this.state.location.coords.latitude
                }
            });
            this.getWeather(this.state.location.lat.toFixed(2), this.state.location.long.toFixed(2));
        }

    };

    getWeather(lat, long) {
        const APIKEY = 'c76ad520e3b298ae1650c9d7d259ead7'
        fetch(`http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${long}&units=metric&APPID=${APIKEY}`)
            .then((response) => response.json())
            .then((responseData) => {
                this.setState({
                    weather: {
                        date: new Date().toUTCString(),
                        city: responseData.name,
                        temperature: responseData.main.temp,
                        weather: responseData.weather[0].description,
                        icon: responseData.weather[0].icon
                    }
                });
            });
    }
    keyExtractor = (item) => item.id;

    renderItem = ({ item }) =>
        <View >
            <Text style={{ fontSize: 20 }}>{item.address}</Text>
        </View>;

    saveAddress = () => {
        if (this.state.address != '' && this.state.name != '') {
            this.addressesRef.push({ address: this.state.address, name: this.state.name });
            this.refs.toast.show('address saved');
            this.setState({ address: '', name: '', modalVisible: false });
        }
        else {
            this.refs.toast.show('Some data is missing');
        }
    };

    saveWeather = () => {
        if (this.state.location != '') {
            this.weatherRef.push({ location: this.state.location, weather: this.state.weather});
            this.refs.toast.show('location and Weather saved');
        }
        else {
            this.refs.toast.show('Some data is missing');
        }
    };

    cancel = () => {
        this.setState({ modalVisible: false });
        this.refs.toast.show('Cancelled');
    };

    listenForAddress(addressesRef) {
        addressesRef.on('value', (snap) => {
            var items = [];
            snap.forEach((child) => {
                items.push({
                    id: child.key,
                    address: child.val().address,
                    name: child.val().name
                });
            });

            this.setState({ addresses: items });
        });
    }

    render() {
        const { navigate } = this.props.navigation;
        const weatherIcon = `http://openweathermap.org/img/w/${this.state.weather.icon}.png`
        return (
            <View style={styles.maincontainer}>
                <Modal animationType="slide"
                    transparent={false}
                    visible={this.state.modalVisible}
                    onRequestClose={() => { }} >
                    <View style={styles.inputcontainer}>
                        <View >
                            <TextInput
                                style={{
                                    height: 40, width: 200, borderColor: 'gray',
                                    borderWidth: 1, marginBottom: 7
                                }}
                                onChangeText={(address) => this.setState({ address })}
                                value={this.state.address}
                                placeholder="address"
                            />
                            <TextInput
                                style={{
                                    height: 40, width: 200, borderColor: 'gray',
                                    borderWidth: 1, marginBottom: 7
                                }}
                                onChangeText={(name) => this.setState({ name })}
                                value={this.state.name}
                                placeholder="name"
                            />
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <Button onPress={this.saveAddress} title="Save" />
                            <Button onPress={this.cancel} title="Cancel" />
                        </View>
                    </View>
                </Modal>
                <View style={styles.weathercontainer}>
                    <Text style={{ fontSize: 20, marginRight: 40 }} h2>{this.state.weather.city}</Text>
                    <Text>
                        Temperature : {this.state.weather.temperature} °C {'\n'}
                        Weather : {this.state.weather.weather}
                    </Text>
                    <Image
                        style={{ width: 60, height: 60 }}
                        source={{ uri: weatherIcon }}
                    />
                    <Button onPress={this.saveWeather} title="Save" />
                </View>
                <View style={styles.headercontainer}>
                    <Text style={{ fontSize: 20, marginRight: 40 }}>ALL Addresses</Text>
                    <Button title="Add"
                        onPress={() => this.setState({ modalVisible: true })} />
                </View>
                <View style={styles.listcontainer}>
                    <List>
                        {
                            this.state.addresses.map((item) => (
                                <ListItem
                                    key={item.id}
                                    title={item.name}
                                    subtitle={item.address}
                                    rightIcon={
                                        <Icon
                                            name={'chevron-right'}
                                            size={20}
                                            onPress={() => navigate('Map', { address: item.address })}
                                        />
                                    }
                                />
                            ))
                        }
                    </List>
                </View>
                <Toast ref="toast" position="top" />
                <Button title="Pedometer" onPress={() => navigate('Pedometer')}/>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    maincontainer: {
        flex: 1,
        backgroundColor: '#F5FCFF',
    },
    weathercontainer: {
        flex: 2,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 5
    },
    headercontainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF',
    },
    listcontainer: {
        flex: 4,
        backgroundColor: '#F5FCFF',
    }
});
AppRegistry.registerComponent('nativefirebase', () => nativefirebase);