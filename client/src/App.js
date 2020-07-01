import React, { Component, Fragment } from 'react';
import { Route, Switch, Redirect, withRouter } from 'react-router-dom';
import Particles from 'react-particles-js';

import Layout from './components/Layout/Layout';
import Backdrop from './components/Backdrop/Backdrop';
import Toolbar from './components/Toolbar/Toolbar';
import MainNavigation from './components/Navigation/MainNavigation/MainNavigation';
import MobileNavigation from './components/Navigation/MobileNavigation/MobileNavigation';
import ErrorHandler from './components/ErrorHandler/ErrorHandler';
import FeedPage from './pages/Feed/Feed';
import SinglePostPage from './pages/Feed/SinglePost/SinglePost';
import LoginPage from './pages/Auth/Login';
import SignupPage from './pages/Auth/Signup';
import './App.css';

class App extends Component {
    state = {
        showBackdrop: false,
        showMobileNav: false,
        isAuth: false,
        token: null,
        userId: null,
        authLoading: false,
        error: null
    };

    componentDidMount() {
        const token = localStorage.getItem('token');
        const expiryDate = localStorage.getItem('expiryDate');
        if (!token || !expiryDate) {
            return;
        }
        if (new Date(expiryDate) <= new Date()) {
            this.logoutHandler();
            return;
        }
        const userId = localStorage.getItem('userId');
        const remainingMilliseconds =
            new Date(expiryDate).getTime() - new Date().getTime();
        this.setState({ isAuth: true, token: token, userId: userId });
        this.setAutoLogout(remainingMilliseconds);
    }

    mobileNavHandler = isOpen => {
        this.setState({ showMobileNav: isOpen, showBackdrop: isOpen });
    };

    backdropClickHandler = () => {
        this.setState({ showBackdrop: false, showMobileNav: false, error: null });
    };

    logoutHandler = () => {
        this.setState({ isAuth: false, token: null });
        localStorage.removeItem('token');
        localStorage.removeItem('expiryDate');
        localStorage.removeItem('userId');
    };

    loginHandler = (event, authData) => {
        event.preventDefault();
        this.setState({ authLoading: true });
        fetch('https://upost-server-live.herokuapp.com/auth/signin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: authData.email,
                password: authData.password
            })
        })
            .then(res => {
                if (res.status === 422) {
                    throw new Error('Validation failed.');
                }
                if (res.status !== 200 && res.status !== 201) {
                    // console.log('Error!');
                    throw new Error('Could not authenticate you!');
                }
                return res.json();
            })
            .then(resData => {
                // console.log(resData);
                this.setState({
                    isAuth: true,
                    token: resData.token,
                    authLoading: false,
                    userId: resData.userId
                });
                localStorage.setItem('token', resData.token);
                localStorage.setItem('userId', resData.userId);
                const remainingMilliseconds = resData.expiresIn * 1000;
                const expiryDate = new Date(
                    new Date().getTime() + remainingMilliseconds
                );
                localStorage.setItem('expiryDate', expiryDate.toISOString());
                this.setAutoLogout(remainingMilliseconds);
            })
            .catch(err => {
                // console.log(err);
                this.setState({
                    isAuth: false,
                    authLoading: false,
                    error: err
                });
            });
    };

    signupHandler = (event, authData) => {
        // console.log(authData);
        event.preventDefault();
        this.setState({ authLoading: true });
        fetch('https://upost-server-live.herokuapp.com/auth/signup', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: authData.signupForm.name.value,
                email: authData.signupForm.email.value,
                password: authData.signupForm.password.value
            })
        })
            .then(res => {
                // console.log(res);
                if (res.status === 422) {
                    throw new Error(
                        "Validation failed."
                    );
                }
                if (res.status !== 200 && res.status !== 201) {
                    // console.log('Error!');
                    throw new Error('Creating a user failed!');
                }
                return res.json();
            })
            .then(resData => {
                // console.log(resData);
                this.setState({ isAuth: false, authLoading: false });
                this.props.history.replace('/');
            })
            .catch(err => {
                // console.log(err);
                this.setState({
                    isAuth: false,
                    authLoading: false,
                    error: err
                });
            });
    };

    setAutoLogout = milliseconds => {
        setTimeout(() => {
            this.logoutHandler();
        }, milliseconds);
    };

    errorHandler = () => {
        this.setState({ error: null });
    };

    render() {
        let routes = (
            <Switch>
                <Route
                    path="/"
                    exact
                    render={props => (
                        <LoginPage
                            {...props}
                            onLogin={this.loginHandler}
                            loading={this.state.authLoading}
                        />
                    )}
                />
                <Route
                    path="/signup"
                    exact
                    render={props => (
                        <SignupPage
                            {...props}
                            onSignup={this.signupHandler}
                            loading={this.state.authLoading}
                        />
                    )}
                />
                <Redirect to="/" />
            </Switch>
        );
        if (this.state.isAuth) {
            routes = (
                <Switch>
                    <Route
                        path="/"
                        exact
                        render={props => (
                            <FeedPage userId={this.state.userId} token={this.state.token} />
                        )}
                    />
                    <Route
                        path="/:postId"
                        render={props => (
                            <SinglePostPage
                                {...props}
                                userId={this.state.userId}
                                token={this.state.token}
                            />
                        )}
                    />
                    <Redirect to="/" />
                </Switch>
            );
        }
        return (
            <Fragment>
                {this.state.showBackdrop && (
                    <Backdrop onClick={this.backdropClickHandler} />
                )}
                <ErrorHandler error={this.state.error} onHandle={this.errorHandler} />
                <Layout
                    header={
                        <Toolbar>
                            <MainNavigation
                                onOpenMobileNav={this.mobileNavHandler.bind(this, true)}
                                onLogout={this.logoutHandler}
                                isAuth={this.state.isAuth}
                            />
                        </Toolbar>
                    }
                    mobileNav={
                        <MobileNavigation
                            open={this.state.showMobileNav}
                            mobile
                            onChooseItem={this.mobileNavHandler.bind(this, false)}
                            onLogout={this.logoutHandler}
                            isAuth={this.state.isAuth}
                        />
                    }
                />
                {routes}
                {
                    !this.state.isAuth ?
                        <Particles
                            params={{
                                particles: {
                                    number: {
                                        value: 100,
                                        density: {
                                            enable: true,
                                            value_area: 800
                                        }
                                    },
                                    color: { value: "#a3586d" },
                                    shape: {
                                        type: "circle",
                                        stroke: {
                                            width: 0,
                                            color: "#a3586d"
                                        },
                                        polygon: {
                                            nb_sides: 3
                                        },
                                        image: {
                                            src: "img/github.svg",
                                            width: 100,
                                            height: 100
                                        }
                                    },
                                    opacity: {
                                        value: 0.5,
                                        random: false,
                                        anim: {
                                            enable: false,
                                            speed: 1,
                                            opacity_min: 0.1,
                                            sync: false
                                        }
                                    },
                                    size: {
                                        value: 5,
                                        random: true,
                                        anim: {
                                            enable: false,
                                            speed: 20,
                                            size_min: 0.1,
                                            sync: false
                                        }
                                    },
                                    line_linked: {
                                        enable: true,
                                        distance: 130,
                                        color: "#a3586d",
                                        opacity: 0.4,
                                        width: 1
                                    },
                                    move: {
                                        enable: true,
                                        speed: 6,
                                        direction: "none",
                                        random: false,
                                        straight: false,
                                        out_mode: "out",
                                        bounce: false,
                                        attract: {
                                            enable: false,
                                            rotateX: 600,
                                            rotateY: 1200
                                        }
                                    }
                                },
                                interactivity: {
                                    detect_on: "canvas",
                                    events: {
                                        onhover: {
                                            enable: true,
                                            mode: "repulse"
                                        },
                                        onclick: {
                                            enable: true,
                                            mode: "push"
                                        },
                                        resize: true
                                    },
                                    modes: {
                                        grab: {
                                            distance: 400,
                                            line_linked: {
                                                opacity: 1
                                            }
                                        },
                                        bubble: {
                                            distance: 400,
                                            size: 40,
                                            duration: 2,
                                            opacity: 8,
                                            speed: 3
                                        },
                                        repulse: {
                                            distance: 100,
                                            duration: 0.4
                                        },
                                        push: {
                                            particles_nb: 4
                                        },
                                        remove: {
                                            particles_nb: 2
                                        }
                                    }
                                },
                                retina_detect: true
                            }
                            }
                            style={{
                                width: '100%',
                                backgroundColor: '#1f1641',
                                height: '100vh',
                                position: 'fixed',
                                zIndex: '-1',
                                top: '0',
                                left: '0'
                            }}
                        />
                        : null
                }
            </Fragment>

        );
    }
}

export default withRouter(App);
