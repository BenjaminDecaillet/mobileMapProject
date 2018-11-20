import React from 'react';
import { StyleSheet, View, Alert, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { MapView, Location, Permissions } from 'expo';

import API_KEYS from '../config/api_keys';
import {  Button, Text, List, ListItem } from 'react-native-elements';

import Dialog, { DialogContent, DialogTitle, DialogButton } from 'react-native-popup-dialog';
import RadioForm, {RadioButton, RadioButtonInput, RadioButtonLabel} from 'react-native-simple-radio-button';

import moment from 'moment';
import polyline from '@mapbox/polyline';

const routes_profile = [
    {
        label: 'Public transport (BETA: only in Helsinki)',
        value: 'public'
    },
    {
        label: 'Walk', 
        value: 'foot-walking' 
    },
    {
        label: 'Car', 
        value: 'driving-car'
    },
    {
        label: 'Bicycle', 
        value:'cycling-regular'
    }
];

export default class Map extends React.Component {
    static navigationOptions = { 
        title: 'Map',
    };
    
    constructor(props) {
        super(props);
        this.state = {
            modal:false,
            dialogVisible: false,
            waitingRouteDetails: true,
            routeBeingFetched: false,
            routeProfile: '',
            markers: [
                {
                    latitude: this.props.navigation.state.params.lat,
                    longitude: this.props.navigation.state.params.long,
                    title: this.props.navigation.state.params.title
                }
            ],
            address: {
                address: this.props.navigation.state.params.address,
                title: this.props.navigation.state.params.title,
                lat: this.props.navigation.state.params.lat,
                long: this.props.navigation.state.params.long,
            },
            region: {
                latitude: this.props.navigation.state.params.lat,
                longitude: this.props.navigation.state.params.long,
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

        switch(this.state.routeProfile){
            case 'public':
                this.getRoutePublicTransports();
                return;
            default:
                this.getRouteOpenRouteService(); 
        }
    }

    getRoutePublicTransports = () => {
        // prepare request
        const url = 'https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql';
        const graphqlarguments = `{
            plan(
              from: {lat: ${this.state.position.latitude}, lon: ${this.state.position.longitude}}
              to: {lat: ${this.state.region.latitude}, lon: ${this.state.region.longitude}}
              numItineraries: 3
            ) {
              itineraries {
                legs {
                  startTime
                  endTime
                  mode
                  duration
                  from {
                    lat
                    lon
                    name
                    stop {
                      code
                      name
                    }
                  }
                  to {
                    lat
                    lon
                    name
                    stop {
                      code
                      name
                    }
                  }
                  realTime
                  distance
                  transitLeg
                  legGeometry {
                    length
                    points
                  }
                }
              }
            }
          }`;

          fetch(
              url,
              {
                method: 'POST',
                headers: {'Content-Type':'application/graphql'},
                body: graphqlarguments
            }
          )
          .then(response => response.json())
          .then(responseData => {
                // check if route planner could find at least one route
                if(responseData.data.plan.itineraries.length > 0){
                    const steps = [];
                    const coordinates = [];
                    let duration = 0;
                    let distance = 0;
                    
                    responseData.data.plan.itineraries[0].legs.forEach(leg => {
                        // convert timestamp to dates with moment library
                        const start = moment(leg.startTime);
                        const end = moment(leg.endTime);
    
                        // duration is in secondes
                        duration += (leg.duration)/60;
    
                        // distance is in meters
                        distance += leg.distance;
    
                        // add steps following the desired schema to the steps array
                        steps.push({
                            distance: leg.distance,
                            duration: leg.duration,
                            instruction: `${moment(start).format('HH:mm')}-${moment(end).format('HH:mm')}: ${leg.mode} from ${leg.from.name} to ${leg.to.name}`,
                        });
    
                        // get the path to this leg's destination provided by the API and convert it to an array of latitude/longitude
                        // instead of Google polyline-encoded format
                        let polylineExtracted = polyline.decode(leg.legGeometry.points);
                        polylineExtracted.forEach(item => {
                            coordinates.push({
                                latitude: item[0],
                                longitude: item[1]
                            });
                        });
                    });
    
                    // Add current's location of user  
                    const markers = this.state.markers;
                    const startMarker = coordinates[0];
                    startMarker.title = 'Your location';
                    markers.push(startMarker);
    
                    // modify the state to display all these informations
                    this.setState({
                        route:{
                            polyline:coordinates,
                            duration:duration,
                            distance:distance,
                            steps:steps
                        },
                        markers:markers,
                        waitingRouteDetails:false,
                        routeBeingFetched: false
                    });
                }else{
                    // display an error message
                    this.setState({
                        waitingRouteDetails:false,
                        routeBeingFetched: false
                    });

                    Alert.alert(
                        'Error',
                        'Impossible to find a route to the desired location.',
                        [
                          {text: 'OK'},
                        ]
                      )
                }
                
          })
          .catch((error) => {
              console.log(error);
          });
    }

    getRouteOpenRouteService = () => {
        // get the profile choosed by the user
        console.log(this.state.routeProfile);

        // preparing request
        const api_key = API_KEYS.OPEN_ROUTE_SERVICE;
        const profile = this.state.routeProfile; // possibilities: driving-car cycling-regular foot-walking
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

                // Add current's location of user  
                const markers = this.state.markers;
                const startMarker = coordinates[0];
                startMarker.title = 'Your location';
                markers.push(startMarker);

                // duration is in seconds
                const duration = (responseData.routes[0].summary.duration)/60;

                // distance is in meters
                const distance = responseData.routes[0].summary.distance;

                // update the state to refresh the map's display
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

    openDialog = () => {
        this.setState({
            dialogVisible:true
        });
    }

    closeDialog = () => {
        this.setState({
            dialogVisible:false
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
                            strokeColor="#3D6DCC" // fallback for when `strokeColors` is not supported by the map-provider
                            strokeWidth={4}
                        />                        
                    </MapView>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding:20, backgroundColor:'#fff' }}>
                    <Button 
                        title="Go there" 
                        onPress= {this.openDialog}
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
                            <Text style={{ fontSize: 20, marginRight: 40 }}>Distance: {Math.round(this.state.route.distance)} meters</Text>
                            <Text style={{ fontSize: 20, marginRight: 40 }}>Duration: {Math.round(this.state.route.duration)} minutes</Text>
                        </View>
                        <View style={styles.listcontainer}>
                            <ScrollView>
                                <List>
                                    {
                                        (this.state.route.steps).map((step, index) => (
                                            <ListItem
                                                key={index}
                                                title={step.instruction}
                                                subtitle={Math.round(step.distance) + ' meters (Estimated time: ' + Math.round((step.duration)/60) + ' minutes)'}                                        
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
                <Dialog
                    visible={this.state.dialogVisible}
                    width={0.75}
                    onTouchOutside={() => {
                        this.setState({ dialogVisible: false });
                    }}
                    dialogTitle={<DialogTitle title="Route details" />}
                    actions={[
                        <DialogButton
                            key='cancel-dialog'
                            text="Cancel"
                            onPress={ this.closeDialog }
                            textStyle={{ color: '#3D6DCC' }}
                        />,
                        <DialogButton
                            key='search-route-dialog'
                            text="Search route"
                            onPress={ () => { this.closeDialog(); this.getRoute(); } }
                            textStyle={{ color: '#3D6DCC' }}
                        />,
                      ]}
                >
                    <DialogContent>
                        <Text>Please choose the type of transport you want to use:</Text>
                        <RadioForm
                            radio_props={routes_profile}
                            initial={routes_profile[0]}
                            buttonColor={'#3D6DCC'}
                            selectedButtonColor={'#3D6DCC'}
                            onPress={(value) => {this.setState({routeProfile:value})}}
                        />
                    </DialogContent>
                </Dialog>

                <Dialog
                    visible={this.state.routeBeingFetched}
                    width={0.75}
                    dialogTitle={<DialogTitle title="Please wait" />}
                >
                    <DialogContent>
                        <ActivityIndicator size="large" color="#3D6DCC"/>
                        <Text >Retrieving your location and route to destination...</Text>
                    </DialogContent>
                </Dialog>
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