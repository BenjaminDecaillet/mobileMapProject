import { WEATHER_DEMARCATION, OUTSIDE_VENUES, INSIDE_VENUES, ALWAYS_OK, PROFILE_INSIDE, PROFILE_OUTSIDE, PROFILE_BOTH } from './FilterTypes';

export function filteringPoi(weather, profile) {
    //Bad Weather
    if (weather.weatherid < WEATHER_DEMARCATION) {
        return _ProfileInsideOutside(profile.badWeather)
    }
    //Good weather
    else {
        return _ProfileInsideOutside(profile.goodWeather)
    }
};


export function definingProfile(historyList) {
    let badWeather = [0, 0];
    let goodWeather = [0, 0];
    let temp, profile = {};
    const venues = [...OUTSIDE_VENUES, ...INSIDE_VENUES, ...ALWAYS_OK]

    historyList.map(function (item) {
        const tagIndex = venues.findIndex(venues => venues === item.poitag)
        temp = _InsideOutside(tagIndex);
        //Bad weather
        if (item.weatherid < WEATHER_DEMARCATION) {
            badWeather[0] = badWeather[0] + temp[0];
            badWeather[1] = badWeather[1] + temp[1];
        }
        //Good weather
        else {
            goodWeather[0] = goodWeather[0] + temp[0];
            goodWeather[1] = goodWeather[1] + temp[1];
        }
    })

    if (badWeather[0] > badWeather[1]) {
        profile = { ...profile, badWeather: PROFILE_OUTSIDE }
    }
    else if (badWeather[0] < badWeather[1]) {
        profile = { ...profile, badWeather: PROFILE_INSIDE }
    }
    else {
        profile = { ...profile, badWeather: PROFILE_BOTH }
    }

    if (goodWeather[0] > goodWeather[1]) {
        profile = { ...profile, goodWeather: PROFILE_OUTSIDE }
    }
    else if (goodWeather[0] < goodWeather[1]) {
        profile = { ...profile, goodWeather: PROFILE_INSIDE }
    }
    else {
        profile = { ...profile, goodWeather: PROFILE_BOTH }
    }
    return profile;
};

function _InsideOutside(id) {
    if (id < 0) {
        return [0, 0];
    }
    else if (id < OUTSIDE_VENUES.length) {
        return [1, 0];
    }
    else if (id < OUTSIDE_VENUES.length + INSIDE_VENUES.length) {
        return [0, 1];
    }
    else if (id == OUTSIDE_VENUES.length + INSIDE_VENUES.length) {
        return [1, 1];
    }
    else {
        return [0, 0];
    }
};

function _ProfileInsideOutside(type) {
    switch (type) {
        case PROFILE_INSIDE:
            return arrayToString(INSIDE_VENUES);
        case PROFILE_OUTSIDE:
            return arrayToString(OUTSIDE_VENUES);
        default:
            return '';
    }
}

function arrayToString(array) {
    let string = '';
    array.map(function (item) {
        string = string + item + ", ";
    })

    return string.substring(0, string.length-2);
}