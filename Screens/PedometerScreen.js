import React from 'react';
import { Component } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-elements';
import { Pedometer } from "expo";

export default class PedometerScreen extends Component {
    static navigationOptions = { 
        title: 'Pedometer'
    };

    constructor(props) {
        super(props);
        this.state = {
            isPedometerAvailable: "checking",
            pastStepCount: 0,
            currentStepCount: 0
        };
    }

    componentDidMount() {
        this.subscribe();
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    // this method will connect to the native SDK to get pedometer informations
    subscribe = () => {
        // connect to the Pedometer and update the state of the currentStepCount
        // subscribe to pedometer updates and update the current step count
        this._subscription = Pedometer.watchStepCount(result => {
            this.setState({
                currentStepCount: result.steps
            });
        });
        // check if pedometer is available for async purposes and update the status
        Pedometer.isAvailableAsync().then(result => {
            this.setState({
                isPedometerAvailable: String(result)
            });
        }, error => {
            this.setState({
                isPedometerAvailable: "Could not get isPedometerAvailable: " + error
            });
        });
        // try to get the number of steps for the last 24 hours
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 1);

        // get step count between yestarday and today
        Pedometer.getStepCountAsync(start, end).then(result => {
            this.setState({ pastStepCount: result.steps });
        }, error => {
            this.setState({
                pastStepCount: "Could not get stepCount: " + error
            });
        });
    };

    // this method will unsubscribe from the native pedometer
    unsubscribe = () => {
        this._subscription && this._subscription.remove();
        this._subscription = null;
    };

    render() {
        return (
            <View>
                {this.state.isPedometerAvailable === 'checking' ? 
                    <ActivityIndicator size="large" color="#0000ff" />
                    :
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                        <Text h3>
                            {this.state.pastStepCount} steps
                        </Text>
                        <Text>
                            taken in the last 24 hours
                        </Text>
                        <Text h3>
                            {this.state.currentStepCount} steps
                        </Text>
                        <Text>
                            Current counter
                        </Text>
                    </View>
                }            
            </View>
        );
    }
}

Expo.registerRootComponent(PedometerScreen);