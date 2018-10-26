import React from 'react';
import { StyleSheet, TextInput, View, FlatList } from 'react-native';
import Expo, { SQLite } from 'expo';
import { FormLabel, FormInput, Button, Text, List, ListItem, Icon } from 'react-native-elements';

const db = SQLite.openDatabase('shopping.db');

export default class App extends React.Component {
    static navigationOptions = { title: 'My Places' };

    constructor(props) {
        super(props);
        this.state = { address: '', myPlaces: [] };
    }

    componentDidMount() {
        // Create shopping table
        db.transaction(tx => {
            tx.executeSql('create table if not exists address (id integer primary key not null, address text);');
        });
        this.updateList();
    }

    updateList = () => {
        db.transaction(tx => {
            tx.executeSql('select * from address', [], (_, { rows }) =>
                this.setState({ myPlaces: rows._array })
            );
        });
    }

    saveItem = () => {
        db.transaction(tx => {
            tx.executeSql('insert into address (address) values (?)', [this.state.address]);
        }, null, this.updateList)
    }

    deleteItem = (id) => {
        db.transaction(
            tx => {
                tx.executeSql(`delete from address where id = ?;`, [id]);
            }, null, this.updateList
        )
    }

    listSeparator = () => {
        return (
            <View
                style={{
                    height: 5,
                    width: "80%",
                    backgroundColor: "#fff",
                    marginLeft: "10%"
                }}
            />
        );
    };

    render() {
        const { navigate } = this.props.navigation;
        return (
            <View style={styles.container}>
                <View style={{ flex: 1 }}>
                    <FormLabel>PLACEFINDER</FormLabel>
                    <FormInput placeholder='address'
                        onChangeText={(address) => this.setState({ address })}
                        value={this.state.address} />
                    <Button raised icon={{ name: 'save' }} onPress={this.saveItem}
                        title="SAVE" backgroundColor='green' borderRadius={4} />
                </View>
                <View style={{ flex: 3 }}>
                <List>
                    {
                        this.state.myPlaces.map((item) => (
                            <ListItem
                                key={item.id}
                                title={item.address}
                                rightTitle='Show on map'
                                onLongPress={() => this.deleteItem(item.id)}
                                rightIcon={
                                    <Icon
                                        name={'chevron-right'}
                                        size={20}
                                        onPress={() => navigate('Map',{address: item.address})}
                                    />
                                }
                            />
                        ))
                    }
                </List>
                </View>
            </View>
        );
    };
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center'
    },
    listcontainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        alignItems: 'center'
    }
});