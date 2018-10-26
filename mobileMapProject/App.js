import React from 'react';
import { StyleSheet } from 'react-native';
import { createStackNavigator} from 'react-navigation';
import Home from './Home';
import Map from './MapRoute';

const mapProject = createStackNavigator({
  Home: {screen: Home},
  Map : {screen: Map}
});

export default class App extends React.Component {
  render() {
    return <MyApp/>
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
