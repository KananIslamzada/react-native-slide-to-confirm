import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Pressable, PanResponder, Dimensions } from 'react-native';
import Feather from 'react-native-vector-icons/Feather'

const IS_NATIVE_DRIVER = true;
const SlideToConfirm = (
    {
        onSlide,
        onSlideEnd,
        onSlideRelease,
        onSlideBegin,
        onSlideConfirmed,
        onSlideNotConfirmed,
        defaultColor = "#5920BC",
        defaultIconSize = 30,
        tipAnimationEnable = true,
        tipTextSlideAnimEnable = true,
        sliderTipDuration = 300,
        sliderTipDistanceFromLeft = 40,
        goToBackDuration = 300,
        confirmedPercent = 0.8,
        ballPadding = 0,
        disableOnConfirmed = false,
        state = false,
        unconfimredTipText = "",
        confirmedTipText = "",
        confirmedTipTextStyle,
        unconfirmedTipTextStyle,
        sliderButtonComponent = null,
        sliderStyle,
    }) => {
    const pan = useRef(new Animated.Value(0)).current;
    const textAnim = useRef(new Animated.Value(0)).current;
    const [disable, setDisable] = useState(false)
    const [startPoint, setStartPoint] = useState(null)
    const sliderWidth = sliderStyle?.width || Dimensions.get("window").width;

    const getSliderWidth = () => {
        const parentWidth = sliderButtonComponent?.props?.style?.width;
        const childWidth = sliderButtonComponent?.props?.children?.props?.style?.width;
        if (parentWidth) {
            return parentWidth;
        }
        else if (childWidth) {
            return childWidth;
        } else {
            return 40;
        }
    }

    const sliderBallWidth = getSliderWidth();

    const panResponder = PanResponder.create({
        onMoveShouldSetPanResponder: () => !disable,
        onPanResponderGrant: (e) => {
            onSlideBegin?.(e)
            setStartPoint(e.nativeEvent.pageX)
        },
        onPanResponderMove: (e) => {
            onSlide?.(e)
            pan.setValue(e.nativeEvent.pageX - startPoint)
        },
        onPanResponderRelease: (e) => {
            onSlideRelease?.(e)
            pan.flattenOffset();
        },
        onPanResponderEnd: (e) => {
            onSlideEnd?.(e)
            if (pan._value > (sliderWidth - sliderBallWidth - ballPadding) * confirmedPercent) {
                Animated.spring(pan, {
                    toValue: sliderWidth - sliderBallWidth - ballPadding * 2,
                    useNativeDriver: IS_NATIVE_DRIVER,
                    restSpeedThreshold: 2000
                }).start(({ finished }) => {
                    if (finished) {
                        if (disableOnConfirmed) {
                            setDisable(true)
                        }
                        onSlideConfirmed?.(e)
                    }
                })
            }
            else {
                Animated.timing(pan, {
                    toValue: 0,
                    duration: goToBackDuration,
                    useNativeDriver: IS_NATIVE_DRIVER
                }).start(({ finished }) => {
                    if (finished) {
                        onSlideNotConfirmed?.(e)
                        if (tipAnimationEnable) {
                            slidePressed();
                        };
                    };
                });
            };
        }
    })

    const slidePressed = () => {
        if (!disable) {
            Animated.sequence([
                Animated.timing(pan, {
                    toValue: sliderTipDistanceFromLeft,
                    duration: sliderTipDuration,
                    useNativeDriver: IS_NATIVE_DRIVER
                }),
                Animated.timing(pan, {
                    toValue: 0,
                    duration: sliderTipDuration,
                    useNativeDriver: IS_NATIVE_DRIVER
                }),
            ]).start()
        }
    }

    const slideOpacity = pan.interpolate({
        inputRange: [0, (sliderWidth - sliderBallWidth - ballPadding) * confirmedPercent],
        outputRange: [1, 0]
    })

    const checkOpacity = pan.interpolate({
        inputRange: [(sliderWidth - sliderBallWidth - ballPadding) * confirmedPercent, (sliderWidth - sliderBallWidth - ballPadding)],
        outputRange: [0, 1]
    });

    useEffect(() => {
        if (!!unconfimredTipText.length && !!confirmedTipText.length && tipTextSlideAnimEnable) {
            Animated.loop(
                Animated.timing(textAnim, {
                    toValue: sliderWidth - sliderBallWidth,
                    duration: 2000,
                    useNativeDriver: IS_NATIVE_DRIVER
                })
            ).start()
        }
    }, [unconfimredTipText, confirmedTipText, tipTextSlideAnimEnable])

    useEffect(() => {
        if (state) {
            Animated.spring(pan, {
                toValue: sliderWidth - sliderBallWidth - ballPadding * 2,
                useNativeDriver: IS_NATIVE_DRIVER,
                restSpeedThreshold: 2000
            }).start(({ finished }) => {
                if (finished) {
                    if (disableOnConfirmed) {
                        setDisable(true)
                    }
                    onSlideConfirmed?.()
                }
            })
        } else {
            Animated.timing(pan, {
                toValue: 0,
                duration: goToBackDuration,
                useNativeDriver: IS_NATIVE_DRIVER
            }).start(({ finished }) => {
                if (finished) {
                    onSlideNotConfirmed?.()
                    if (tipAnimationEnable) {
                        slidePressed();
                    };
                };
            });
        }
    }, [state])


    return (
        <View style={[{ backgroundColor: defaultColor }, (sliderStyle || null), { paddingLeft: ballPadding, paddingRight: ballPadding }]} >
            <Animated.View   {...panResponder.panHandlers} style={{ zIndex: 1, transform: [{ translateX: pan }] }}>
                {!!sliderButtonComponent ?
                    sliderButtonComponent :
                    <Pressable style={styles.defaultBall} onPress={() => tipAnimationEnable && slidePressed()} >
                        <Animated.View style={[styles.defaultCevronRight, { opacity: slideOpacity }]} >
                            <Feather name='chevron-right' color={defaultColor} size={defaultIconSize} />
                        </Animated.View>
                        <Animated.View style={[styles.defaultChecked, { opacity: checkOpacity }]} >
                            <Feather name='check' color={defaultColor} size={defaultIconSize} />
                        </Animated.View>
                    </Pressable>
                }
            </Animated.View>
            {(!!unconfimredTipText.length && !!confirmedTipText.length) &&
                <>
                    <Animated.Text style={[styles.tipText, { opacity: slideOpacity }, unconfirmedTipTextStyle]} >{unconfimredTipText}</Animated.Text>
                    <Animated.Text style={[styles.tipText, { opacity: checkOpacity }, confirmedTipTextStyle]} >{confirmedTipText}</Animated.Text>
                </>
            }
            {tipTextSlideAnimEnable && <Animated.View style={[styles.textSlideAnimStyle, { transform: [{ translateX: textAnim }], backgroundColor: sliderStyle?.backgroundColor || defaultColor }]} />}
        </View>
    );
}

const styles = StyleSheet.create({
    tipText: {
        zIndex: 0,
        position: 'absolute',
        alignSelf: 'center',
    },
    defaultBall: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        width: 40,
        borderRadius: 20,
        backgroundColor: "white",
        zIndex: 1
    },
    defaultCevronRight: {
        position: 'absolute',
    },
    defaultChecked: {
        position: 'absolute',
    },
    textSlideAnimStyle: {
        height: "100%",
        opacity: 0.5,
        width: 10,
        position: 'absolute',
    }

});

export default SlideToConfirm;