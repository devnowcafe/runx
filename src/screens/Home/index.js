import React from "react";
import { View, AsyncStorage, TouchableOpacity } from "react-native";
import { Button, Text } from 'native-base';
import BackgroundGeolocation from 'react-native-background-geolocation';
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import Spinner from 'react-native-loading-spinner-overlay';
import haversine from "haversine";
import { Configs } from '@configs';
import styles from './home.style';
const LATITUDE_DELTA = 0.009;
const LONGITUDE_DELTA = 0.009;

export default class HomeScreen extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            distanceTravelled: 0,
            odometer: 0,
            prevLatLng: {},
            isLoading: true,
            runState: {},
            runningDuration: 0,
            isMoving: false,
            markers: [],
            coordinates: [],
            showsUserLocation: true
        };
    }

    componentDidMount() {
        this.getCurrentLocation();

        this.geoLocationListener();
    }

    componentWillUnmount() {
        BackgroundGeolocation.events.forEach(event =>
            BackgroundGeolocation.removeAllListeners(event)
        );
    }

    checkRunState = async () => {
        const value = await AsyncStorage.getItem(`${Configs.StorageKey}:runstate`);
        //console.log("value:", value)
        if (value) {
            const runState = JSON.parse(value);
            if (runState.state === "running" || runState.state === "paused" || runState.state === "finished") {
                const timeStart = new Date(runState.runAt).getTime();
                const timeEnd = runState.state === "running" ? new Date().getTime() : new Date(runState.pauseAt).getTime();
                const timeDiff = (timeEnd - timeStart) / 1000; //in ms

                this.setState({
                    isLoading: false,
                    runningDuration: timeDiff || 0,
                    runState: runState
                })
                if (runState.state === "running") {
                    this._interval = setInterval(() => {
                        this.setState({ runningDuration: this.state.runningDuration + 1 })
                    }, 1000);
                }
            } else {
                this.setState({ isLoading: false })
            }
        } else {
            this.setState({ isLoading: false })
        }
    }

    componentWillUnmount() {
        if (this._interval) {
            clearInterval(this._interval);
        }
    }

    getCurrentLocation = () => {
        BackgroundGeolocation.getCurrentPosition((location) => {
            console.log('- getCurrentPosition success: ', location);
            this.addMarker(location);
            this.setCenter(location)
            this.checkRunState();
        }, (error) => {
            console.warn('- getCurrentPosition error: ', error);
        }, { persist: true, samples: 1 });
    }

    geoLocationListener = () => {
        BackgroundGeolocation.on('location', (location) => {
            console.log('[event] location: ', location);

            if (!location.sample) {
                const newCoordinate = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                };
                const { distanceTravelled } = this.state;
                this.addMarker(location);
                this.setState({
                    distanceTravelled: distanceTravelled + this.calcDistance(newCoordinate),
                    prevLatLng: newCoordinate,
                    odometer: (location.odometer / 1000).toFixed(1)
                });
            }
            this.setCenter(location)
        });
    }

    addMarker(location) {
        let marker = {
            key: location.uuid,
            title: location.timestamp,
            heading: location.coords.heading,
            coordinate: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            }
        };

        this.setState({
            markers: [...this.state.markers, marker],
            coordinates: [...this.state.coordinates, {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            }]
        });
    }

    setCenter(location) {
        if (!this.refs.map) { return; }

        this.refs.map.animateToRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA
        });
    }

    calcDistance = newLatLng => {
        const { prevLatLng } = this.state;
        return haversine(prevLatLng, newLatLng) || 0;
    };

    handleRunStateChange = async (state) => {
        if (state) {
            let runState = {};
            switch (state) {
                case 'running':
                    runState = { ...this.state.runState, state: 'running', runAt: new Date() };
                    BackgroundGeolocation.start();
                    this._interval = setInterval(() => {
                        this.setState({ runningDuration: this.state.runningDuration + 1 })
                    }, 1000);
                    break;
                case 'paused':
                    runState = { ...this.state.runState, state: 'paused', pauseAt: new Date() };
                    clearInterval(this._interval);
                    BackgroundGeolocation.stop();
                    break;
                case 'resume':
                    runState = { ...this.state.runState, state: 'running' };
                    BackgroundGeolocation.start();
                    this._interval = setInterval(() => {
                        this.setState({ runningDuration: this.state.runningDuration + 1 })
                    }, 1000);
                    break;
                case 'finished':
                    runState = { ...this.state.runState, state: 'finished', finishAt: new Date() };
                    clearInterval(this._interval);
                    BackgroundGeolocation.stop();
                    break;
            }
            await AsyncStorage.setItem(`${Configs.StorageKey}:runstate`, JSON.stringify(runState, null));

            this.setState({ runState })
        }
    }

    handleRunReset = async () => {
        const { markers, coordinates } = this.state;
        await AsyncStorage.removeItem(`${Configs.StorageKey}:runstate`, null);

        this.setState({
            runState: {},
            runningDuration: 0,
            distanceTravelled: 0,
            markers: [markers[markers.length - 1]],
            coordinates: [coordinates[coordinates.length - 1]]
        })
    }

    renderActions = () => {
        const { isLoading, runState, runningDuration, distanceTravelled } = this.state;
        if (!isLoading) {
            const report = () => {
                const duration = new Date(runningDuration * 1000).toISOString().substr(11, 8);
                const distance = parseFloat(distanceTravelled).toFixed(1);
                return (
                    <View style={styles.groupButtons}>
                        <View>
                            <Text style={styles.lable}>Duration</Text>
                            <Text style={styles.duration}>{duration}</Text>
                        </View>
                        <View style={styles.borderMiddle}></View>
                        <View>
                            <Text style={styles.lable}>Distance</Text>
                            <Text style={styles.duration}>{distance}km</Text>
                        </View>
                    </View>
                )
            }
            if (runState.state === "running" || runState.state == "paused") {
                return (
                    <View style={styles.runningContainer}>
                        <Text style={styles.stateText}>{runState.state === 'paused' ? 'PAUSE' : 'RUNNING'}</Text>
                        {report()}
                        <View style={styles.groupButtons}>
                            <TouchableOpacity
                                onPress={() => this.handleRunStateChange(runState.state === 'paused' ? 'resume' : 'paused')}
                                style={[styles.circleButton, styles.pauseButton]}>
                                <Text style={{ fontSize: 15, color: '#ffffff' }}>
                                    {runState.state === 'paused' ? 'RESUME' : 'PAUSE'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => this.handleRunStateChange('finished')}
                                style={[styles.circleButton, styles.finishButton]}>
                                <Text style={{ fontSize: 15, color: '#ffffff' }}>FINISH</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )
            } else if (runState.state == "finished") {
                return (
                    <View style={styles.runningContainer}>
                        <Text style={styles.stateText}>FINISHED</Text>
                        {report()}
                        <View style={styles.groupButtons}>
                            <Button
                                onPress={() => this.handleRunReset()}
                                style={styles.shareButton}>
                                <Text style={{ fontSize: 15, color: '#ffffff' }}>BACK</Text>
                            </Button>
                        </View>
                    </View>
                )
            } else {
                return (
                    <Button
                        rounded
                        style={styles.startButton}
                        onPress={() => { this.handleRunStateChange('running') }}>
                        <Text>BEGIN RUN</Text>
                    </Button>
                )
            }
        } else {
            return null
        }
    }

    renderMap = () => {
        const { showsUserLocation, markers } = this.state;
        return (
            <MapView
                ref="map"
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                showsUserLocation={showsUserLocation}
                followsUserLocation={false}
                scrollEnabled={true}
                showsMyLocationButton={false}
                showsPointsOfInterest={false}
                showsScale={false}
                showsTraffic={false}
                toolbarEnabled={false}>
                <MapView.Polyline
                    key="polyline"
                    coordinates={this.state.coordinates}
                    geodesic={true}
                    strokeColor='rgba(232, 67, 147, 1)'
                    strokeWidth={6}
                    zIndex={0}
                />
                {
                    markers.length > 0 &&
                    <MapView.Marker
                        key={markers[0].key}
                        coordinate={markers[0].coordinate}
                        title={markers[0].title}>
                    </MapView.Marker>
                }
            </MapView>
        )
    }

    render() {
        const { isLoading } = this.state;

        return (
            <View style={styles.container}>
                {this.renderMap()}
                {this.renderActions()}
                <Spinner visible={isLoading} />
            </View>
        );
    }
}

