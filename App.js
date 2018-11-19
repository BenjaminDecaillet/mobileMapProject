import React from 'react';
import { StyleSheet} from 'react-native';
import { createStackNavigator } from 'react-navigation';
import Home from './Screens/HomeScreen';
import Map from './Screens/Map';
import Pedometer from './Screens/PedometerScreen';


const MyApp = createStackNavigator(
  {
    Home: {screen: Home},
    Map: {screen: Map},
    Pedometer: {screen: Pedometer}
  },
  {
    initialRouteName: 'Home',
    navigationOptions: {
      headerStyle: {
        backgroundColor: '#3D6DCC',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    },
  }
  );
  
export default class App extends React.Component {
  render() {
    return <MyApp/>
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection:'column',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
