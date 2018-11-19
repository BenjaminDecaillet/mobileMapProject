import React from 'react';
import { AppRegistry, StyleSheet, View, TextInput, Modal, Image } from 'react-native';
import Toast from 'react-native-easy-toast';
import {  Button, Text, List, ListItem, Icon } from 'react-native-elements';
import { Location, Permissions, SQLite } from 'expo';

const db = SQLite.openDatabase('tourismML.db');

export default class Home extends React.Component {
    static navigationOptions = { title: 'Home' };

    constructor(props) {
        super(props);
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
        //this.resetDatabase();
        this.createDatabase();
        this.updateAddressesList();
        this.getWeatherFromDb();
        this.getLocation();
    }

    resetDatabase = () => {
        console.log('delete');
        db.transaction(tx => {
            tx.executeSql('drop table address;');
            tx.executeSql('drop table weather;');
        });
    }

    createDatabase = () => {
        db.transaction(tx => {
            tx.executeSql('create table if not exists address (id integer primary key not null, address text not null, name text not null);');
            tx.executeSql('create table if not exists weather (id integer primary key not null, latitude text not null, longitude text not null, date text not null, city ext not null, weather text not null, temperature text not null, icon text not null);');
        });
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
                }, function(){
                    console.log(this.state);
                })
            });
    }

    getWeatherFromDb = () => {
        console.log('weather from db');
        db.transaction(tx => {
            tx.executeSql(
                // SQL statement
                'SELECT * FROM Weather',

                // arguments for statement
                [],

                // success function
                (_, { rows }) => {
                    console.log(rows._array)  
                }
            );
        });
    }

    //
    // ADDRESSES MANAGEMENT
    //
    saveAddress = () => {
        if (this.state.address && this.state.name) {
            // save the address in the local db
            db.transaction(tx => {
                tx.executeSql(
                    // statement
                    'insert into Address (address, name) values (?, ?)',
                    
                    // arguments
                    [this.state.address, this.state.name],

                    // sucess function
                    () => {
                        this.showToast('The address has been saved.');
                        this.updateAddressesList();
                    },                    

                    // error function
                    this.showToast('Impossible to save data in the database.')
                );
            });
        }
        else {
            this.showToast('Address and/or name is missing.');
        }
    };

    updateAddressesList = () => {
        // update the addresses list in state and reset the state of the text inputs
        db.transaction(tx => {
            tx.executeSql(
                // SQL statement
                'SELECT * FROM Address',

                // arguments for statement
                [],

                // success function
                (_, { rows }) => {
                    this.setState({
                        addresses: rows._array,
                        address: '', 
                        name: '', 
                        modalVisible: false
                    }, () => {console.log(rows._array)})           
                }
            );
        });
    }

    //
    // WEATHER MANAGEMENT
    //
    saveWeather = () => {
        console.log('weather');
        console.log(this.state);
        if (this.state.location != '') {
            // save the address in the local db
            db.transaction(tx => {
                tx.executeSql(
                    // statement
                    'insert into Weather (latitude, longitude, date, city, weather, temperature, icon) values (?, ?, ?, ?, ?, ?, ?)',

                    // arguments
                    [this.state.location.lat, this.state.location.long, this.state.weather.date, this.state.weather.city, this.state.weather.weather, this.state.weather.temperature, this.state.weather.icon ],

                    // sucess function
                    () => {
                        this.showToast('Weather saved.');
                        this.getWeatherFromDb();
                    },

                    // error function
                    (text, error) => {
                        console.log(error);
                        this.showToast('Impossible to save data in the database.');
                    }
                );
            });
        }
        else {
            this.showToast('Some data is missing.');
        }
    };

    cancel = () => {
        this.setState({ modalVisible: false });
        this.refs.toast.show('Cancelled');
    };

    // method to show toasts
    showToast = (text) => {
        this.refs.toast.show(text);
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
                                            onPress={() => navigate('Map', { address: item.address, title: item.name })}
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