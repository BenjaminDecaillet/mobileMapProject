import React from 'react';
import { StyleSheet, Text, View, Button, Alert, TextInput, KeyboardAvoidingView } from 'react-native';
import { MapView, Location, Permissions } from 'expo';

export default class App extends React.Component {
    static navigationOptions = { title: 'Map' };
    constructor(props) {
        super(props);
        this.state = {
            geoLoc: '',
            long: 0,
            lat: 0,
            title: '',
            forceRefresh: Math.floor(Math.random() * 100),
            location: null,
            markers: []
        };
    }

    /*
    * MapFit api Key
    * 591dccc4e499ca0001a4c6a4e621b9de7fcb43a1aa6909ff272ff5e7
    * Get Request
    * https://api.mapfit.com/v2/geocode?street_address=119+w+24th+st+new+york+ny&building=true&api_key=591dccc4e499ca0001a4c6a4e621b9de7fcb43a1aa6909ff272ff5e7
    */

    componentDidMount() {
        this.getInfos();
    }

    async getInfos() {
        
        const { navigate } = this.props.navigation;
        const { params } = this.props.navigation.state;
        const API_KEY = '591dccc4e499ca0001a4c6a4e621b9de7fcb43a1aa6909ff272ff5e7';
        const url = `https://api.mapfit.com/v2/geocode?street_address=${params.address}&building=true&api_key=${API_KEY}`;

        const res = await fetch(url);
        const geoLocRes = await res.json();

        await this.setState({ geoLoc: geoLocRes });
        this.setState({
            long: this.state.geoLoc[0].location.lon,
            lat: this.state.geoLoc[0].location.lat,
            title: this.state.geoLoc[0].street_address,
            forceRefresh: Math.floor(Math.random() * 100),
            markers: [
                {
                    latitude: this.state.geoLoc[0].location.lat,
                    longitude: this.state.geoLoc[0].location.lon,
                    title: this.state.geoLoc[0].street_address
                }
            ]
        });
    }

    render() {
        const { navigate } = this.props.navigation;
        const { params } = this.props.navigation.state;
        return (
            <View style={{ flex: 1 }}>
                <MapView
                    key={this.state.forceRefresh}
                    style={{ flex: 6 }}
                    initialRegion={{
                        latitude: this.state.lat,
                        longitude: this.state.long,
                        latitudeDelta: 0.0322,
                        longitudeDelta: 0.0221,
                    }}
                >
                    {this.state.markers.map((item, index) => {
                        return <MapView.Marker coordinate={{ latitude: item.latitude, longitude: item.longitude }} title={item.title} key={index} />
                    })}
                </MapView>
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
    }
});