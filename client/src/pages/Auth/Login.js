import React, { Component } from 'react';

import Input from '../../components/Form/Input/Input';
import Button from '../../components/Button/Button';
import { required, length, email } from '../../util/validators';
import Auth from './Auth';

class Login extends Component {
    state = {
        loginForm: {
            email: {
                value: '',
                valid: false,
                touched: false,
                validators: [required, email]
            },
            password: {
                value: '',
                valid: false,
                touched: false,
                validators: [required, length({ min: 5 })]
            },
            formIsValid: false
        }
    };

    inputChangeHandler = (input, value) => {
        this.setState(prevState => {
            let isValid = true;
            for (const validator of prevState.loginForm[input].validators) {
                isValid = isValid && validator(value);
            }
            const updatedForm = {
                ...prevState.loginForm,
                [input]: {
                    ...prevState.loginForm[input],
                    valid: isValid,
                    value: value
                }
            };
            let formIsValid = true;
            for (const inputName in updatedForm) {
                if (inputName !== 'formIsValid') {
                    formIsValid = formIsValid && updatedForm[inputName].valid;
                }
            }
            updatedForm.formIsValid = formIsValid;
            return {
                loginForm: updatedForm
            };
        });
    };

    inputBlurHandler = input => {
        this.setState(prevState => {
            return {
                loginForm: {
                    ...prevState.loginForm,
                    [input]: {
                        ...prevState.loginForm[input],
                        touched: true
                    }
                }
            };
        });
    };

    render() {
        // console.log(this.state.loginForm.formIsValid)
        return (
            <>
                <h2 className="signup-form-title">ALREADY HAVE AN ACCOUNT?</h2>
                <Auth>
                    <form
                        onSubmit={e =>
                            this.props.onLogin(e, {
                                email: this.state.loginForm.email.value,
                                password: this.state.loginForm.password.value
                            })
                        }
                    >
                        <Input
                            id="email"
                            label="Your E-Mail"
                            type="email"
                            placeholder="username@domain.com"
                            control="input"
                            onChange={this.inputChangeHandler}
                            onBlur={this.inputBlurHandler.bind(this, 'email')}
                            value={this.state.loginForm['email'].value}
                            valid={this.state.loginForm['email'].valid}
                            touched={this.state.loginForm['email'].touched}
                        />
                        <Input
                            id="password"
                            label="Password"
                            type="password"
                            control="input"
                            placeholder="Must have atleast 5 characters"
                            onChange={this.inputChangeHandler}
                            onBlur={this.inputBlurHandler.bind(this, 'password')}
                            value={this.state.loginForm['password'].value}
                            valid={this.state.loginForm['password'].valid}
                            touched={this.state.loginForm['password'].touched}
                        />
                        <Button design="raised" type="submit" disabled={!this.state.loginForm.formIsValid} loading={this.props.loading}>
                            Login {this.state.loginForm.formIsValid}
                        </Button>
                    </form>
                </Auth>
            </>
        );
    }
}

export default Login;
