import {useEffect, useState} from 'react'
import { documentToReactComponents } from '@contentful/rich-text-react-renderer'
import styles from './DonateBox.scss'
import { loadStripe } from '@stripe/stripe-js';
import React from 'react';



const suggestions = [250,500,1000]

function createStripeDonation(stripe, donationDetails) {
    return fetch("/api/donate", {
        method:"POST",
        headers:{"Content-type":"application/json"},
        body:JSON.stringify(donationDetails)
    }).then((rsp) => rsp.json()).then((rsp) => {
        return stripe.redirectToCheckout({ sessionId: rsp.id });
    })
}

function ResolveStripe(props) {
    const [stripeSession, setSession] = useState(true)
    useEffect(() => {
       loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY).then(setSession)
    },[])
    if ( ! stripeSession) return null
    if (stripeSession) {
        return React.cloneElement(props.children, {...props, stripe:stripeSession})
    }
}

const mxonthlyBudget = 214400
const monthlyBudget = 200000
function donationAmountDescription(amount) {
    const pert = Math.abs((((amount)/monthlyBudget) * 100))
    return `supports ${pert.toFixed(2)} % of our ideal monthly budget`
    return null

    if (amount > 1000) return `supports the whole school for ${Math.abs(amount / 350).toFixed(1)} weeks`
    if (amount === 1000) return "supports the whole school for two weeks"
    if (amount === 500) return "supports two student for one week"
    if (amount > 350) return "supports the whole school for a week"
    if (amount < 250) return `buys ${Math.abs(amount / 10).toFixed(0)} pots of cofee and tea for the students`
    return "supports one student for one week"
}

function StripeDonation(props) {
    const [donationType, setDonationType] = useState("one-time")
    const [donationAmount, setDonationAmount] = useState(250)
    const [donationMessage, setDonationMessage] = useState(false)

    const [isSubmitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState(false)

    const createDonation = () => {
        setSubmitError(false)
        setSubmitting(true)
        if ( ! donationType || ! donationAmount) {
            setSubmitting(false)
            const error = []
            if ( ! donationType) error.push("donation type")
            if ( ! donationAmount) error.push("amount")
            return setSubmitError("Please select a " + error.join(" and "))
        }
        createStripeDonation(props.stripe,{
            type:donationType,
            amount: donationAmount,
            message:donationMessage || ""
        }).then((rsp) => {
            setTimeout(() => setSubmitting(false),500)
        })
    }

    return (
        <div className="stripe-donation">
            <style jsx>{styles}</style>

            <form className="donation-type">
            <div>
                <input type="radio" name="donation-type" checked={donationType === "one-time" ? true : false} value="one-time" onClick={() => setDonationType("one-time")} />
                <label>One time</label>
            </div>
            <div>
                <input type="radio" name="donation-type" value="monthly" onClick={() => setDonationType("monthly")} />
                <label> Monthly</label>
            </div>
            </form>
            
            <ul className="donation-amount">
                {suggestions.map((amount, i) => (
                    <li key={i} className={donationAmount == amount ? "selected-amount" : ""} onClick={() => setDonationAmount(amount)}><label>{amount} <span>dkk</span></label></li>
                ))}
            <li className="input-amount">
                <input type="number" onChange={(e) => setDonationAmount(e.target.value)} placeholder="Other amount" name="donation-type" value={donationAmount || ""} />
            </li>
            </ul>

            <div className="amount-description">
                <h3><span>{donationAmount} dkk</span> {donationAmountDescription(donationAmount)} {donationType === "monthly" && (" every month")}</h3>
            </div>
            {
                donationAmount >= 250 && (
                    <div className="amount-description auto-member">
                        <h3>When you donate, you automatically become a member of the HackYourFuture association and can attend the General Assembly</h3>
                    </div>
                )
            }
        
            <div className="donation-message">
                <label>Message</label>
                <textarea id="donation-message-text" value={donationMessage || ""} onChange={(e) => setDonationMessage(e.target.value)} placeholder="Write a message"></textarea>
            </div>

            {
                submitError && (
                    <div className="donate-error"><p>{submitError}</p></div>
                )
            }

            {
                isSubmitting
                ? (
                    <button className="donation-button">One moment...</button>
                )
                : (
                    <button className="donation-button" onClick={createDonation}>Donate</button>
                )
            }

           
        
        </div>
    )
}

export default function DonateBox(props) {
    return (
        <div className="donate-box">
            <style jsx>{styles}</style>

            <style global jsx>{`aside#donate-copy {
                color: #fff;
                padding: 2em!important;
            }
            #heading {
                margin:0;
            }`}</style>
            <header>
            <aside id="donate-copy">
                {documentToReactComponents({...props.children, content:props.children.content.slice(1,2)})}
            </aside>
            <section>
                <h2 id="heading">Support our work</h2>
                <ResolveStripe>
                <StripeDonation />
                </ResolveStripe>
            </section>
            </header>
        </div>
    )
}