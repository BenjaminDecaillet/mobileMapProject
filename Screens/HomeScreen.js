import React from 'react';
import { StyleSheet, View, Image, ActivityIndicator, ScrollView } from 'react-native';
import Toast from 'react-native-easy-toast';
import { Button, Text, List, ListItem, Icon, FormLabel, FormInput } from 'react-native-elements';
import Dialog, { DialogContent, DialogTitle, DialogButton } from 'react-native-popup-dialog';
import { definingProfile, filteringPoi } from '../ML/FilteringList';
import { Location, Permissions, SQLite } from 'expo';
import API_KEYS from '../config/api_keys';

const db = SQLite.openDatabase('tourismML.db');

const ObjectsExample = [
    {
        "date": "Thu, 29 Nov 2018 11:23:54 GMT",
        "id": 1,
        "poitag": "NATURE & SPORTS",
        "transporttype": "public",
        "weatherid": 803,
    },
    {
        "date": "Thu, 29 Nov 2018 11:23:54 GMT",
        "id": 2,
        "poitag": "SIGHTS & ATTRACTIONS",
        "transporttype": "public",
        "weatherid": 803,
    },
    {
        "date": "Thu, 29 Nov 2018 11:23:54 GMT",
        "id": 3,
        "poitag": "MUSEUMS & GALLERIES",
        "transporttype": "public",
        "weatherid": 603,
    },
    {
        "date": "Thu, 29 Nov 2018 11:23:54 GMT",
        "id": 4,
        "poitag": "SHOPPING",
        "transporttype": "public",
        "weatherid": 603,
    }
]

export default class Home extends React.Component {
    static navigationOptions = {
        title: 'Home',
    };

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
                lat: '',
                long: '',
                range: '1', //Range by default for searching locations near the user
                language: 'en', //Language of the results to be loaded
                pageLimit: '10' // Size of the page that the API Return
            },
            location: {},
            addresses: [],
            poi: [],
            numberOfPoi: -1,
            history: [],
            weather: {},
            profile: {},
            poiTagsFilter: '',
            poiTagsSearch: '',
            modalVisible: false,
            dialogVisible: false
        };
    }

    componentDidMount() {
        //this.resetDatabase();
        this.createDatabase();
        this.getHistoryFromDb();
        this.getLocation();

    }

    resetDatabase = () => {
        console.log('delete database');
        db.transaction(tx => {
            tx.executeSql('drop table history;');
        });
        this.createDatabase();
    }

    createDatabase = () => {
        db.transaction(tx => {
            tx.executeSql('create table if not exists history (id integer primary key not null, weatherid integer not null, poitag text not null, transporttype text not null, date text not null);');
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
                },
                profile: definingProfile(ObjectsExample)
            });
            this.getWeather(this.state.location.lat.toFixed(2), this.state.location.long.toFixed(2), true)
        }

    };

    //Get a point of interest by it's ID
    _getPoiByID = (id) => {
        const detailUrl = `http://open-api.myhelsinki.fi/v1/place/${id}?&language_filter=en`
        fetch(detailUrl)
            .then((response) => response.json())
            .then((responseData) => {
                this.setState({
                    poi: [...this.state.poi, responseData],
                    numberOfPoi: Number(this.state.numberOfPoi) + 1
                })
            });
    }

    //Research Point of Interest from the API with inputted parameters
    _getPoI = (long, lat, range, language, pageLimit, tagsFilter, tagsSearch) => {
        this.setState({
            poi: []
        })
        //Tests if some filters or Search parameters are inputted and if true input them in the api request
        let search = '';
        let filter = '';
        //Filter the api based on the user profile with URI encodage for components
        if (tagsSearch != '') {
            search = `tags_search=${encodeURIComponent(tagsSearch)}&`;
        }
        if (tagsFilter != '') {
            filter = `tags_filter=${tagsFilter}&`;
        }

        const ListUrl = `http://open-api.myhelsinki.fi/v1/places/?${search}${filter}distance_filter=${lat},${long},${range}&language_filter=${language}&limit=${pageLimit}`;
        
        // Fetch tue POI and then set the list in the state and the number of POI
        fetch(ListUrl)
            .then((response) => response.json())
            .then((responseData) => {
                this.setState({
                    poi: responseData.data,
                    numberOfPoi: responseData.meta.count
                })
            });


    }


    getWeather(lat, long, poiSearch = false) {
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
                        weatherid: responseData.weather[0].id,
                        icon: responseData.weather[0].icon
                    },
                    poiTagsSearch: filteringPoi({ weatherid: responseData.weather[0].id }, this.state.profile)
                }, function () {
                    if (poiSearch) {
                        this._getPoI(
                            this.state.location.long,
                            this.state.location.lat,
                            this.state.searchCriterias.range,
                            this.state.searchCriterias.language,
                            this.state.searchCriterias.pageLimit,
                            this.state.poiTagsFilter,
                            this.state.poiTagsSearch);
                    }
                })
            });
    }

    /**
     * HISTORY MANAGEMENT
     */
    getHistoryFromDb = () => {
        console.log('History from db');
        db.transaction(tx => {
            tx.executeSql(
                // SQL statement
                'SELECT * FROM history',

                // arguments for statement
                [],

                // success function
                (_, { rows }) => {
                    //console.log(rows._array)
                    this.setState({
                        history: rows._array
                    }, function () { console.log(this.state.history) })
                }
            );
        });
    }

    saveHistory = (weather, poitag, transport) => {
        if (this.state.location != '') {
            // save the address in the local db
            db.transaction(tx => {
                tx.executeSql(
                    // statement
                    'insert into history (weatherid, poitag , transporttype , date ) values (?, ?, ?, ?)',

                    // arguments
                    [weather.weatherid, poitag, transport, weather.date],

                    // sucess function
                    () => {
                        this.showToast('History item saved.');
                        this.getHistoryFromDb();
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

    _saveMockHistory = () => {
        this.saveHistory(this.state.weather, 'NATURE & SPORTS', 'public');
        this.saveHistory(this.state.weather, 'SIGHTS & ATTRACTIONS', 'public');
        this.saveHistory(this.state.weather, 'SAUNA & WELLNESS', 'public');
        this.saveHistory({ weatherid: 602, date: this.state.weather.date }, 'MUSEUMS & GALLERIES', 'public');
        this.saveHistory({ weatherid: 703, date: this.state.weather.date }, 'SHOPPING', 'public');
        this.saveHistory({ weatherid: 202, date: this.state.weather.date }, 'RESTAURANTS & CAFES', 'public');
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
                        </View>
                        :
                        null
                    }
                </View>
                <View style={styles.listcontainer}>
                    
                    {this.state.numberOfPoi === -1 ?
                        <View>
                            <ActivityIndicator size="large" color="#0000ff" />
                            <Text>Loading points of interest near your position...</Text>
                        </View>
                        :
                        null
                    }
                    {this.state.numberOfPoi !== -1 ?
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
                                                    navigation: this.props.navigation,
                                                    saveHistory : this.saveHistory,
                                                    weather : this.state.weather
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
                        {/*
                        <Button
                            title="Reset Database"
                            onPress={() => this.resetDatabase()}
                            backgroundColor='#3D6DCC'
                        />
                        */}
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