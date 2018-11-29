import React from 'react';
import { StyleSheet, View, Image, ActivityIndicator, ScrollView } from 'react-native';
import Toast from 'react-native-easy-toast';
import { Button, Text, List, ListItem, Icon, FormLabel, FormInput } from 'react-native-elements';
import Dialog, { DialogContent, DialogTitle, DialogButton } from 'react-native-popup-dialog';

import { Location, Permissions, SQLite } from 'expo';
import { brain } from '../ML/Brain';
import API_KEYS from '../config/api_keys';

const db = SQLite.openDatabase('tourismML.db');


const detailBaseUrl = `http://open-api.myhelsinki.fi/v1/place/`

export default class Home extends React.Component {
    static navigationOptions = {
        title: 'Home',
    };
    /**
     * TAGS Intersting for project
     * NATURE & SPORTS
     * Bowling
     * Biking
     * Monument
     * Church
     * ContemporaryArt
     * Museum
     * Restaurant
     */
    constructor(props) {
        super(props);
        this.state = {
            address: {
                address: '',
                name: '',
                latitude: 0,
                longitude: 0
            },
            searchCriterias: {
                tagsSearch: '',
                tagsFilter: '',
                lat: '',
                long: '',
                range: '0.2',
                language: 'en',
                pageLimit: '10'
            },
            location: {},
            addresses: [],
            poi: [],
            numberOfPoi: -1,
            poiTags: [],
            weather: {},
            modalVisible: false,
            dialogVisible: false
        };
    }

    componentDidMount() {
        //this.resetDatabase();
        this.createDatabase();
        this.updateAddressesList();
        this.getWeatherFromDb();
        this.getLocation();
        brain();
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
            tx.executeSql('create table if not exists address (id integer primary key not null, address text not null, name text not null, latitude text not null, longitude text not null);');
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
            let location = await Location.getCurrentPositionAsync({ enableHighAccuracy: true });
            await this.setState({ location });
            await this.setState({
                location: {
                    long: this.state.location.coords.longitude,
                    lat: this.state.location.coords.latitude
                }
            });
            this.getWeather(this.state.location.lat.toFixed(2), this.state.location.long.toFixed(2));
            this._getPoI(
                this.state.location.long,
                this.state.location.lat,
                this.state.searchCriterias.range,
                this.state.searchCriterias.language,
                this.state.searchCriterias.pageLimit,
                this.state.searchCriterias.tagsFilter,
                this.state.searchCriterias.tagsSearch);
        }

    };

    _getPoiByID = (id) => {
        const detailUrl = `http://open-api.myhelsinki.fi/v1/place/${id}?&language_filter=en`
        fetch(detailUrl)
            .then((response) => response.json())
            .then((responseData) => {
                this.setState({
                    poi: [...this.state.poi, responseData]
                })
            });
    }

    _getPoI = (long, lat, range, language, pageLimit, tagsFilter, tagsSearch) => {
        this.setState({
            poi: []
        })
        let search = '';
        let filter = '';
        if (tagsSearch != '') {
            search = `tags_serach=${tagsSearch}&`;
        }
        if (tagsFilter != '') {
            filter = `tags_filter=${tagsFilter}&`;
        }
        const ListUrl = `http://open-api.myhelsinki.fi/v1/places/?${search}${filter}distance_filter=${lat},${long},${range}&language_filter=${language}&limit=${pageLimit}`;

        fetch(ListUrl)
            .then((response) => response.json())
            .then((responseData) => {
                this.setState({
                    poi: responseData.data,
                    numberOfPoi: responseData.meta.count,
                    poiTags: responseData.tags
                }, function () {
                    this._getPoiByID('3229');
                    this._getPoiByID('3299')
                })
            });


    }


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
    saveAddress = async () => {
        if (this.state.address.address && this.state.address.name) {
            // get latitude and longitude for address
            await this.forwardGeoCode();

            // save the address in the local db
            db.transaction(tx => {
                tx.executeSql(
                    // statement
                    'insert into Address (address, name, latitude, longitude) values (?, ?, ?, ?)',

                    // arguments
                    [this.state.address.address, this.state.address.name, this.state.address.latitude, this.state.address.longitude],

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

    forwardGeoCode = async () => {
        console.log('geocode');
        // preparing request
        const api_key = API_KEYS.OPEN_ROUTE_SERVICE;
        const url = `https://api.openrouteservice.org/geocode/search?api_key=${api_key}&text=${this.state.address.address}`

        // request
        await fetch(url)
            .then((response) => response.json())
            .then((responseData) => {
                console.log(responseData);

                const address = this.state.address;
                address.latitude = responseData.features[0].geometry.coordinates[1];
                address.longitude = responseData.features[0].geometry.coordinates[0];

                this.setState({ address });
            });
    }

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
                        /*address:{
                            address: '',
                            name: '',
                            latitude: 0,
                            longitude: 0
                        },*/
                        modalVisible: false
                    });
                }
            );
        });
    }

    //
    // WEATHER MANAGEMENT
    //
    saveWeather = () => {
        if (this.state.location != '') {
            // save the address in the local db
            db.transaction(tx => {
                tx.executeSql(
                    // statement
                    'insert into Weather (latitude, longitude, date, city, weather, temperature, icon) values (?, ?, ?, ?, ?, ?, ?)',

                    // arguments
                    [this.state.location.lat, this.state.location.long, this.state.weather.date, this.state.weather.city, this.state.weather.weather, this.state.weather.temperature, this.state.weather.icon],

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

    openDialog = () => {
        this.setState({ dialogVisible: true });
    }

    closeDialog = () => {
        this.setState({ dialogVisible: false });
    }

    // method to show toasts
    showToast = (text) => {
        this.refs.toast.show(text);
    }

    render() {
        const { navigate } = this.props.navigation;
        const weatherIcon = `http://openweathermap.org/img/w/${this.state.weather.icon}.png`
        return (
            <View style={styles.maincontainer}>
                <Dialog
                    visible={this.state.dialogVisible}
                    width={0.9}
                    onTouchOutside={() => {
                        this.setState({ dialogVisible: false });
                    }}
                    dialogTitle={<DialogTitle title="Route details" />}
                    actions={[
                        <DialogButton
                            key='cancel-dialog'
                            text="Cancel"
                            onPress={this.closeDialog}
                            textStyle={{ color: '#3D6DCC' }}
                        />,
                        <DialogButton
                            key='add-address-dialog'
                            text="Add address"
                            onPress={() => { this.closeDialog(); this.saveAddress(); }}
                            textStyle={{ color: '#3D6DCC' }}
                        />,
                    ]}
                >
                    <DialogContent>
                        <Text>Please choose the type of transport you want to use:</Text>
                        <View>
                            <FormLabel>Address</FormLabel>
                            <FormInput
                                onChangeText={(address) => this.setState({ address: { ...this.state.address, address: address } })}
                                value={this.state.address.address}
                                placeholder="Type in an address"
                                inputStyle={{ borderBottomColor: 'darkslateblue', borderBottomWidth: 1 }}
                                containerStyle={{ width: '100%' }}
                            />
                            <FormLabel>Name</FormLabel>
                            <FormInput
                                onChangeText={(name) => this.setState({ address: { ...this.state.address, name: name } })}
                                value={this.state.address.name}
                                placeholder="Type in a name"
                                inputStyle={{ borderBottomColor: 'darkslateblue', borderBottomWidth: 1 }}
                            />
                        </View>
                    </DialogContent>
                </Dialog>

                <View style={styles.weathercontainer}>
                    {typeof this.state.weather.city === 'undefined' ?
                        <View>
                            <ActivityIndicator size="large" color="#0000ff" />
                            <Text>Loading weather for your position...</Text>
                        </View>
                        :
                        null
                    }
                    {typeof this.state.weather.city !== 'undefined' ?
                        <View>
                            <Text style={{ fontSize: 20, marginRight: 40 }} h2>{this.state.weather.city}</Text>
                            <Text>
                                Temperature : {this.state.weather.temperature} °C {'\n'}
                                Weather : {this.state.weather.weather}
                            </Text>
                            <Image
                                style={{ width: 60, height: 60 }}
                                source={{ uri: weatherIcon }}
                            />
                            <Button
                                onPress={this.saveWeather}
                                title="Save"
                                backgroundColor='#3D6DCC'
                            />
                        </View>
                        :
                        null
                    }
                </View>
                <View style={styles.listcontainer}>

                    <Text>
                        {/*
                    <ScrollView>
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
                                            />
                                        }
                                        onPress={() => navigate('Map', {
                                            address: item.address,
                                            title: item.name,
                                            lat: parseFloat(item.latitude),
                                            long: parseFloat(item.longitude)
                                        })}
                                    />
                                ))
                            }
                        </List>
                    </ScrollView>
                    */}
                    </Text>

                    {typeof this.state.poi[1] === 'undefined' ?
                        <View>
                            <ActivityIndicator size="large" color="#0000ff" />
                            <Text>Loading points of interest near your position...</Text>
                        </View>
                        :
                        null
                    }
                    {typeof this.state.poi[1] !== 'undefined' ?
                        <View>
                            <View style={{ flexDirection: 'row', padding: 10 }}>
                                <Text h4>Number of POI near you: {this.state.numberOfPoi}</Text>
                            </View>
                            <ScrollView>
                                <List>
                                    {
                                        this.state.poi.map((item) => (
                                            <ListItem
                                                key={item.id}
                                                title={item.name.en}
                                                subtitle={(item.description.body != '') ? `${item.description.body.substring(0, 40)}...` : ''}
                                                rightIcon={
                                                    <Icon
                                                        name={'chevron-right'}
                                                        size={20}
                                                    />
                                                }
                                                onPress={() => navigate('POIDetail', {
                                                    poi: item,
                                                    navigation: this.props.navigation
                                                })}
                                            />
                                        ))
                                    }
                                </List>
                            </ScrollView>
                        </View>
                        :
                        null
                    }


                    <View style={{ flexDirection: "row", justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                        <Button
                            title="Add an address"
                            onPress={() => this.setState({ dialogVisible: true })}
                            backgroundColor='#3D6DCC'
                        />
                        <Button
                            title="Pedometer"
                            onPress={() => navigate('Pedometer')}
                            backgroundColor='#3D6DCC'
                        />
                    </View>
                </View>
                <Toast ref="toast" position="bottom" />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    maincontainer: {
        flex: 1,
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
        borderTopColor: '#000000',
        borderTopWidth: 1
    },
    listcontainer: {
        flex: 6,
    },
    inputcontainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});