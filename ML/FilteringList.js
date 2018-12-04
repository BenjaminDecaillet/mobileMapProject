import { WEATHER_DEMARCATION, OUTSIDE_VENUES, INSIDE_VENUES, ALWAYS_OK, PROFILE_INSIDE, PROFILE_OUTSIDE, PROFILE_BOTH } from './FilterTypes';

//Based on current weather and profile inputted from user ({good weather = {Ins / Outs / Both}} , {bad weather = { Ins / Outs / Both }})
//return the needed filtering list for the api to have venues that only conform with our user profile
export function filteringPoi(weather, profile) {
    //Based on the inputed weather know if it is Good / Bad Weather from the WEATHER_DEMARCATION LIMIT
    //Bad Weather
    if (weather.weatherid < WEATHER_DEMARCATION) {
        return _ProfileInsideOutside(profile.badWeather)
    }
    //Good weather
    else {
        return _ProfileInsideOutside(profile.goodWeather)
    }
};

//Function to define the profile of the user based on it's history, two main filter points are Good or Bad weather currently
export function definingProfile(historyList) {
    //Define the variables that will enable us to know if during Good / Bad Weather the user is inside or Outside
    let badWeather = [0, 0];
    let goodWeather = [0, 0];
    let temp, profile = {};
    //Set the list of the Major tags returned from the api to filter the results
    const venues = [...OUTSIDE_VENUES, ...INSIDE_VENUES, ...ALWAYS_OK]

    //Run through the history of the user inputted each history item has a weather id and a tag
    historyList.map(function (item) {
        //Find in the list of Major tag the history item tag if existant and return it's index
        const tagIndex = venues.findIndex(venues => venues === item.poitag)
        //Based on the index of the tag return an element [ x {outside} , x {inside}] depends on wether the venues was inside or outside
        temp = _InsideOutside(tagIndex);

        //Based on the History item weatherid know if it is Good / Bad Weather from the WEATHER_DEMARCATION LIMIT
        //Increment the variables of the Good / Bad weather with the element return from the previous function _InsideOutside
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

//Based on the length of each Array of venues know if an element is inside / outside / Always OK / not taken into account
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

//Actual function that return the search list elements based on the profile type (Inside / Outside / Both = 'no filter' )
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

//Convert the array of venues to a String usable for input into the api request as parameter
function arrayToString(array) {
    let string = '';
    array.map(function (item) {
        string = string + item + ", ";
    })

    return string.substring(0, string.length-2);
}