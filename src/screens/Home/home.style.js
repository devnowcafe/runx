import { StyleSheet, Dimensions } from 'react-native';
const { width } = Dimensions.get("window")

export default StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "flex-end",
        alignItems: "center"
    },
    map: {
        ...StyleSheet.absoluteFillObject
    },
    runningContainer: {
        backgroundColor: '#ffffff',
        width: width,
        height: 200,
        //justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 15
    },
    lable: {
        fontSize: 16
    },
    duration: {
        fontSize: 25,
        fontWeight: '500'
    },
    stateText: {
        fontSize: 20,
        fontWeight: '500'
    },
    groupButtons: {
        marginTop: 15,
        flexDirection: 'row',
    },
    circleButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 10
    },
    finishButton: {
        backgroundColor: '#ff3838'
    },
    pauseButton: {
        backgroundColor: '#9b59b6'
    },
    startButton: {
        width: width - 100,
        marginBottom: 20,
        alignItems: 'center',
        alignSelf: 'center',
        justifyContent: 'center',
        backgroundColor: '#e84393'
    },
    shareButton: {
        width: width - 100,
        alignItems: 'center',
        alignSelf: 'center',
        justifyContent: 'center',
        backgroundColor: '#e84393'
    },
    borderMiddle: {
        width: 1,
        height: 50,
        marginHorizontal: 15,
        marginTop: 5,
        backgroundColor: '#000000'
    },
});