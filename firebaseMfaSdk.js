// firebaseMfaSdk.js
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier, multiFactor, PhoneAuthProvider } from "firebase/auth";

class FirebaseMfaSDK {
    constructor() {
        this.app = null;
        this.auth = null;
    }

    // Initialize Firebase with user's configuration file
    initializeApp(config) {
        this.app = initializeApp(config);
        this.auth = getAuth(this.app);
        console.log("Firebase initialized");
    }

    // Set up recaptcha verifier for user login
    setupRecaptcha(containerId) {
        this.auth.recaptchaVerifier = new RecaptchaVerifier(containerId, {
            size: "invisible",
            callback: (response) => {
                console.log("Recaptcha verified", response);
            },
        }, this.auth);
    }

    // Send OTP to user phone number for authentication
    async sendOtp(phoneNumber) {
        try {
            const appVerifier = this.auth.recaptchaVerifier;
            const confirmationResult = await signInWithPhoneNumber(this.auth, phoneNumber, appVerifier);
            console.log("OTP sent to phone", confirmationResult);
            return confirmationResult; // Store this to confirm the code later
        } catch (error) {
            console.error("Error sending OTP", error);
        }
    }

    // Confirm OTP entered by the user
    async confirmOtp(confirmationResult, verificationCode) {
        try {
            const userCredential = await confirmationResult.confirm(verificationCode);
            console.log("Phone number verified", userCredential.user);
            return userCredential;
        } catch (error) {
            console.error("Error verifying OTP", error);
        }
    }

    // Enable MFA for the current user
    async enableMfa(user) {
        const mfaEnrollment = await multiFactor(user).getSession();
        console.log("MFA session initiated", mfaEnrollment);
        return mfaEnrollment;
    }

    // Verify the second factor (like SMS, email, etc.)
    async verifyMfa(user, verificationCode) {
        try {
            const phoneAuthProvider = new PhoneAuthProvider(this.auth);
            const verificationId = await phoneAuthProvider.verifyPhoneNumber(user.phoneNumber, mfaEnrollment);
            const phoneCredential = PhoneAuthProvider.credential(verificationId, verificationCode);
            const userCredential = await multiFactor(user).enroll(phoneCredential, "Phone Number MFA");
            console.log("MFA successfully added", userCredential);
            return userCredential;
        } catch (error) {
            console.error("Error verifying MFA", error);
        }
    }

    // User sign out
    signOut() {
        this.auth.signOut().then(() => {
            console.log("User signed out");
        }).catch((error) => {
            console.error("Sign out error", error);
        });
    }
}

export default FirebaseMfaSDK;
