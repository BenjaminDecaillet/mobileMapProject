
import React from 'react'
import { FlatList, View, Text } from 'react-native'
import { ListItem, Icon} from 'react-native-elements'
import { withNavigation } from 'react-navigation';

const _renderItem = (item, parentNavigate) => (
    <ListItem style={{ width: 250 }}
        title={item.name}
        subtitle={item.address}
        rightIcon={
            <Icon
                name={'chevron-right'}
                size={20}
                onPress={() => parentNavigate('Map',{address: item.address})}
            />
        }
    />
);

renderItem = ({item}, parentNavigate) => (
    <ListItem
        title={item.name}
        subtitle={item.address}
        rightIcon={
            <Icon
                name={'chevron-right'}
                size={20}
                onPress={() => parentNavigate('Map')}
            />
        }
    />
);

const _renderSeparator = () => (
    <View style={{ height: 1, backgroundColor: 'grey' }} />
);


const _renderHeader = () => (
    <View
        style={{ height: 30, backgroundColor: '#ccc', justifyContent: 'center' }}
    >
        <Text>Header</Text>
    </View>
);

const _renderFooter = () => (
    <View
        style={{ height: 30, backgroundColor: '#ccc', justifyContent: 'center' }}
    >
        <Text>Footer</Text>
    </View>
);


const _keyExtractor = (item) => item.id;

export default (POIList = (props, parentNavigate) => (
    <FlatList
        data={props.data}
        //renderItem={ _renderItem}
        renderItem={(item, parentNavigate) => this.renderItem(item, parentNavigate)}
        keyExtractor={_keyExtractor}
        ItemSeparatorComponent={_renderSeparator}
        ListHeaderComponent={_renderHeader}
        ListFooterComponent={_renderFooter}
    />
));
