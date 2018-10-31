import React from 'react';
import { AppRegistry, StyleSheet, View, TextInput, Modal, FlatList } from 'react-native';
import Toast, { DURATION } from 'react-native-easy-toast';
import { FormLabel, FormInput, Button, Text, List, ListItem, Icon } from 'react-native-elements';
import POIList from '../Components/POIList'

import * as firebase from 'firebase';

const firebaseConfig = {
    apiKey: "AIzaSyAlqehP9XgJklN8ChRbAShB3xhN4G3Eq78",
    authDomain: "benproject-2e82e.firebaseapp.com",
    databaseURL: "https://benproject-2e82e.firebaseio.com",
    storageBucket: "benproject-2e82e.appspot.com"
};

const firebaseApp = firebase.initializeApp(firebaseConfig);

export default class App extends React.Component {
    static navigationOptions = { title: 'Home' };

    constructor(props) {
        super(props);
        this.itemsRef = firebaseApp.database().ref('addresses');
        this.state = {
            address: '',
            name: '',
            long: '',
            lat: '',
            addresses: [],
            modalVisible: false
        };
    }

    componentDidMount() {
        this.listenForItems(this.itemsRef);
    }

    keyExtractor = (item) => item.id;

    renderItem = ({ item }) =>
        <View >
            <Text style={{ fontSize: 20 }}>{item.address}</Text>
        </View>;

    saveItem = () => {
        if (this.state.address != '' && this.state.name != '') {
            this.itemsRef.push({ address: this.state.address, name: this.state.name });
            this.refs.toast.show('address saved');
            this.setState({ address: '', name: '', modalVisible: false });
        }
        else {
            this.refs.toast.show('Some data is missing');
        }
    };

    cancel = () => {
        this.setState({ modalVisible: false });
        this.refs.toast.show('Cancelled');
    };

    listenForItems(itemsRef) {
        itemsRef.on('value', (snap) => {
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
                            <Button onPress={this.saveItem} title="Save" />
                            <Button onPress={this.cancel} title="Cancel" />
                        </View>
                    </View>
                </Modal>
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
            </View>
        );
    }
}

const styles = StyleSheet.create({
    maincontainer: {
        flex: 1,
        backgroundColor: '#F5FCFF',
    },
    headercontainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF',
    },
    inputcontainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF',
    },
    listcontainer: {
        flex: 4,
        backgroundColor: '#F5FCFF',
    },
    listdetails: {
        width: '100%',
        backgroundColor: 'red'
    }

});
AppRegistry.registerComponent('nativefirebase', () => nativefirebase);