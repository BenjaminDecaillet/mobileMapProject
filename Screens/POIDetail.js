import React, { Component } from 'react';
import { StyleSheet, View, ScrollView, Linking } from 'react-native';
import { Button, Text, Icon } from 'react-native-elements';
import moment from 'moment';
import Carousel from '../Components/Carousel';

class POIDetail extends Component {

    constructor(props) {
        super(props)
        this.state = {
            weekDays: ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        }
    }

    handleClick = (url) => {
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                console.log("Don't know how to open URI: " + url);
            }
        });
    };

    _displayTimeTables = (hours, exception) => {
        if (hours === null) {
            return (
                <Text style={styles.schedule_title}>No Information on schedule </Text>
            )
        }
        else {
            return (
                <View>
                    <Text style={styles.schedule_title}>Opening hours: </Text>
                    {hours.map((day, index) => (
                        <Text key={index} style={styles.schedule_text}>
                            {this.state.weekDays[day.weekday_id]}:{' '}
                            {moment(day.opens, "HH:mm:ss").format('HH:mm')} / {moment(day.closes, "HH:mm:ss").format('HH:mm')}
                        </Text>
                    ))}
                    <Text style={styles.schedule_text}>{exception}</Text>

                </View>
            )
        }
    }

    _displayPoi() {
        const { poi, navigation } = this.props.navigation.state.params;
        console.log(poi.opening_hours.hours);
        console.log(poi.opening_hours.hours === null);
        if (poi != undefined) {
            let street = '';
            let postalCode = '';
            let locality = '';
            if (poi.location.address.street_address !== null) {
                street = poi.location.address.street_address;
            }
            if (poi.location.address.postal_code !== null) {
                postalCode = poi.location.address.postal_code;
            }
            if (poi.location.address.locality !== null) {
                locality = poi.location.address.locality;
            }
            const address = street + ', ' + postalCode + ' ' + locality
            return (
                <View>
                    <ScrollView style={styles.scrollview_container}>
                        <View style={{ flex: 1, flexDirection: "row" }}>
                            <Text style={styles.title_text}>
                                {poi.name.en}
                            </Text>
                            {typeof poi.info_url !== '' ?
                                <Icon
                                    reverse
                                    reverseColor='#FFF'
                                    name='web'
                                    color='#4286f4'
                                    type='material-community'
                                    size={20}
                                    onPress={() => this.handleClick(poi.info_url)}
                                />
                                :
                                null
                            }

                        </View>
                        <View style={{ flex: 2 }}>
                            <Text style={styles.description_text}>{poi.description.body}</Text>
                            <Text style={styles.description_text}>
                                {address}
                            </Text>
                            <Text style={styles.default_text}>Tag(s) :
                            {poi.tags.map(function (tag) {
                                    return tag.name;
                                }).join(" / ")}
                            </Text>
                        </View>
                        {typeof poi.description.images !== null ?
                            <Carousel images={poi.description.images} />
                            :
                            null
                        }
                        {this._displayTimeTables(poi.opening_hours.hours, poi.opening_hours.openinghours_exception)}
                    </ScrollView>
                    <Button
                        title="Show on map"
                        onPress={() => navigation.navigate('Map', {
                            address: address,
                            title: poi.name.en,
                            lat: parseFloat(poi.location.lat),
                            long: parseFloat(poi.location.lon)
                        })}
                        backgroundColor='#3D6DCC'
                    />
                </View>
            )
        }
    }

    render() {
        return (
            <View style={styles.maincontainer}>
                {this._displayPoi()}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    maincontainer: {
        flex: 1,
    },
    title_text: {
        fontWeight: 'bold',
        fontSize: 35,
        flex: 1,
        flexWrap: 'wrap',
        marginLeft: 5,
        marginRight: 5,
        marginTop: 10,
        marginBottom: 10,
        color: '#000000',
        textAlign: 'center'
    },
    schedule_title: {
        fontStyle: 'italic',
        fontWeight: 'bold',
        fontSize: 16,
        flexWrap: 'wrap',
        marginLeft: 5,
        marginRight: 5,
        marginTop: 5,
        color: '#666',
        textAlign: 'center'
    },
    schedule_text: {
        fontStyle: 'italic',
        flexWrap: 'wrap',
        marginLeft: 5,
        marginRight: 5,
        marginTop: 5,
        color: '#666',
        textAlign: 'center'
    },
    description_text: {
        fontStyle: 'italic',
        color: '#666666',
        margin: 5,
        marginBottom: 15
    },
    default_text: {
        marginLeft: 5,
        marginRight: 5,
        marginTop: 5,
    }
});

export default POIDetail;