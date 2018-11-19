import React from 'react';
import { StyleSheet, View, Alert, Modal, ScrollView  } from 'react-native';
import { MapView, Location, Permissions } from 'expo';

import API_KEYS from '../config/api_keys'
import {  Button, Text, List, ListItem } from 'react-native-elements';


export default class Map extends React.Component {
    static navigationOptions = { 
        title: 'Map',
    };
    
    constructor(props) {
        super(props);
        this.state = {
            modal:false,
            waitingRouteDetails: true,
            routeBeingFetched: false,
            markers: [],
            address: {
                address: this.props.navigation.state.params.address,
                title: this.props.navigation.state.params.title
            },
            region: {
                latitude: 0,
                longitude: 0,
                latitudeDelta: 0.0322,
                longitudeDelta: 0.0221,
            },
            position:{
                latitude: 0,
                longitude: 0
            },
            route:{
                polyline:[],
                distance: '',
                duration: '',
                steps: []
            }
        };
    }

    componentDidMount() {
        this.forwardGeoCode();
    }

    getLocation = async () => {
        //Check permission
        let { status } = await Permissions.askAsync(Permissions.LOCATION);
        if (status !== 'granted') {
            Alert.alert('No permission to access location');
        }
        else {
            let location = await Location.getCurrentPositionAsync({ enableHighAccuracy: true });
            //await this.setState({ location });
            console.log(location)
            await this.setState({
                position:{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                }
            });
        }
    };

    forwardGeoCode = () => {
        // preparing request
        const api_key = API_KEYS.OPEN_ROUTE_SERVICE;
        const url = `https://api.openrouteservice.org/geocode/search?api_key=${api_key}&text=${this.state.address.address}`

        // request
        fetch(url)
            .then((response) => response.json())
            .then((responseData) => {
                console.log(responseData);
                const route = this.state.route;
                route.polyline = [];

                this.setState(
                    {
                        region: {
                            latitudeDelta: 0.0322,
                            longitudeDelta: 0.0221,
                            latitude: responseData.features[0].geometry.coordinates[1],
                            longitude: responseData.features[0].geometry.coordinates[0]
                        },
                        markers: [
                            {
                                latitude: responseData.features[0].geometry.coordinates[1],
                                longitude: responseData.features[0].geometry.coordinates[0],
                                title: this.state.address.title
                            }
                        ],
                        route:route
                    }
                );
            });
    }

    getRoute = async () => {
        // disable the button used to retrieve the route while getting the route
        this.setState({
            routeBeingFetched: true
        });

        // get current position
        await this.getLocation();

        // preparing request
        const api_key = API_KEYS.OPEN_ROUTE_SERVICE;
        const profile = "foot-walking"; // possibilities: driving-car cycling-regular foot-walking
        const url = `https://api.openrouteservice.org/directions?api_key=${api_key}&coordinates=${this.state.position.longitude},${this.state.position.latitude}|${this.state.region.longitude},${this.state.region.latitude}&profile=${profile}&geometry_format=polyline`

        // get route from point A to point B
        console.log(url);
        fetch(url)
            .then((response) => response.json())
            .then((responseData) => {
                // transform array of coordinates to objects LatLng for the path on the map
                const coordinates = [];
                responseData.routes[0].geometry.forEach(coordinate => {
                    coordinates.push({
                        latitude: coordinate[1],
                        longitude: coordinate[0]
                    })
                })

                const markers = [];
                markers.push(coordinates[0]);
                markers.push(coordinates[coordinates.length-1]);

                const duration = (responseData.routes[0].summary.duration)/60;
                const distance = responseData.routes[0].summary.distance;

                this.setState({
                    route:{
                        polyline:coordinates,
                        duration:duration,
                        distance:distance,
                        steps:responseData.routes[0].segments[0].steps
                    },
                    markers:markers,
                    waitingRouteDetails:false,
                    routeBeingFetched: false
                })
            });
    }

    getRouteDetails = () => {
        this.setState({
            modal:true
        })
    }

    closeModal = () => {
        this.setState({
            modal:false
        });
    }

    render() {
        const { navigate } = this.props.navigation;
        const { params } = this.props.navigation.state;
        return (
            <View style={{ flex: 1 }}>
                <View style={{ flex: 8 }}>
                    <MapView
                        key={this.state.forceRefresh}
                        style={{ flex: 6 }}
                        region={this.state.region}
                    >
                        {this.state.markers.map((item, index) => {
                            return <MapView.Marker coordinate={{ latitude: item.latitude, longitude: item.longitude }} title={item.title} key={index} />
                        })}                        
                        <MapView.Polyline
                            coordinates={this.state.route.polyline}
                            strokeColor="#000" // fallback for when `strokeColors` is not supported by the map-provider
                            strokeColors={[
                                '#7F0000',
                                '#00000000', // no color, creates a "long" gradient between the previous and next coordinate
                                '#B24112',
                                '#E5845C',
                                '#238C23',
                                '#7F0000'
                            ]}
                            strokeWidth={4}
                        />                        
                    </MapView>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding:20, backgroundColor:'#fff' }}>
                    <Button 
                        title="Go there" 
                        onPress= {this.getRoute}
                        disabled={this.state.routeBeingFetched}
                        backgroundColor='#3D6DCC'
                    />
                    <Button 
                        title="Route details" 
                        onPress= {this.getRouteDetails}
                        disabled={this.state.waitingRouteDetails}
                        backgroundColor='#3D6DCC'
                    />
                </View>
                <Modal animationType="slide"
                    transparent={false}
                    visible={this.state.modal}
                    onRequestClose={() => { }} >
                    <View style={styles.modalcontainer}>
                        <View>
                            <Text style={{ fontSize: 20, marginRight: 40 }}>Route information</Text>
                            <Text style={{ fontSize: 20, marginRight: 40 }}>Distance: {this.state.route.distance} meters</Text>
                            <Text style={{ fontSize: 20, marginRight: 40 }}>Duration: {this.state.route.duration} minutes</Text>
                        </View>
                        <View style={styles.listcontainer}>
                            <ScrollView>
                                <List>
                                    {
                                        (this.state.route.steps).map((step, index) => (
                                            <ListItem
                                                key={index}
                                                title={step.instruction}
                                                subtitle={step.distance + ' meters (Estimated time: ' + ((step.duration)/60).toFixed(2) + ' minutes'}                                        
                                            />
                                        ))
                                    }
                                </List>
                            </ScrollView>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <Button onPress={this.closeModal} title="Quit" />
                        </View>
                    </View>
                </Modal>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalcontainer: {
        flex: 1,
        backgroundColor: '#F5FCFF',
    },
    listcontainer: {
        flex: 4,
        backgroundColor: '#F5FCFF',
    }
});