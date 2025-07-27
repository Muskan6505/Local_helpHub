import React from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/index.js";
import {
    ArrowRight,
    Heart,
    Users2,
    Shield,
    CheckCircle,
    MapPin
} from 'lucide-react';

function Welcome() {
    const features = [
        {
            title: "Ask for Help",
            description: "Post what you need help with – from groceries to tutoring to household tasks.",
            icon: <Heart className="h-6 w-6 text-blue-600" />,
            bgColor: "bg-blue-100"
        },
        {
            title: "Offer Support",
            description: "Browse requests in your area and offer to help your neighbors.",
            icon: <Users2 className="h-6 w-6 text-green-600" />,
            bgColor: "bg-green-100"
        },
        {
            title: "Stay Connected",
            description: "Build lasting relationships and strengthen your local community.",
            icon: <Shield className="h-6 w-6 text-purple-600" />,
            bgColor: "bg-purple-100"
        }
    ];

    const features1 = [
        {
            title: "Location-Based Matching",
            description: "Connect with helpers and requesters in your immediate area."
        },
        {
            title: "Verified Community",
            description: "User verification and rating system for trust and safety."
        },
        {
            title: "Real-Time Communication",
            description: "Built-in messaging system to coordinate help effectively."
        },
        {
            title: "Free to Use",
            description: "No fees, no subscriptions. Just community helping community."
        }
    ];

    return (
        <>
            <Navbar />
            <section className="bg-[#f0f6ff] flex flex-col justify-center items-center text-center px-6 pt-40">
                <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 leading-tight max-w-2xl">
                    Connect. Help. <span className="text-blue-600">Grow Together.</span>
                </h1>
                <p className="mt-4 text-gray-600 text-xl max-w-xl">
                    Local HelpHub brings communities together through mutual aid. Ask for help when you need it, offer help when you can.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                    <Link to="/signup" className="bg-blue-600 text-white px-10 py-2 font-semibold text-xl rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
                        Join Your Community <ArrowRight size={18} />
                    </Link>
                    <Link to="/login" className="bg-white text-black px-10 py-2 font-semibold text-md rounded-lg border hover:bg-gray-100 transition">
                        Browse Help Requests
                    </Link>
                </div>
            </section>

            <section className="bg-[#f0f6ff] pb-20 px-6 text-center pt-30">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">How Local HelpHub Works</h2>
                <p className="text-gray-600 mb-10 text-xl">Simple, safe, and effective community support</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-lg transition"
                        >
                            <div className={`p-4 rounded-full mb-4 ${feature.bgColor}`}>
                                {feature.icon}
                            </div>
                            <h3 className="font-semibold text-lg text-gray-900">{feature.title}</h3>
                            <p className="text-gray-600 mt-2">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="bg-[#f0f6ff] py-20 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    {/* Left: Features */}
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">
                            Why Choose Local HelpHub?
                        </h2>
                        <ul className="space-y-6">
                            {features1.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-4">
                                    <CheckCircle className="text-green-600 mt-1" />
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                                        <p className="text-gray-600">{item.description}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Right: Call to action box */}
                    <div className="bg-white shadow-xl rounded-xl p-8 text-center">
                        <div className="bg-blue-100 w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4">
                            <MapPin className="text-blue-600 w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Find Help Near You
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Join thousands of neighbors already helping each other in your community.
                        </p>
                        <Link
                            to="/signup"
                            className="bg-blue-600 text-white px-6 py-3 w-full sm:w-auto rounded-lg hover:bg-blue-700 transition text-center block"
                        >
                            Start Helping Today
                        </Link>
                    </div>
                </div>
            </section>

            <div>
                {/* CTA Section */}
                <section className="bg-gray-50 py-20 text-center px-6">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Ready to Build a Stronger Community?
                    </h2>
                    <p className="text-gray-600 mb-8">
                        Join Local HelpHub today and start making a difference in your neighborhood.
                    </p>
                    <Link
                        to="/signup"
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition mx-auto w-max"
                    >
                        Get Started for Free <ArrowRight size={18} />
                    </Link>
                </section>

                {/* Footer */}
                <footer className="bg-[#0c1121] text-white text-center py-8">
                    <div className="flex justify-center items-center gap-2 mb-2">
                        <Heart className="w-5 h-5 text-white" />
                        <span className="font-semibold text-lg">Local HelpHub</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                        Building stronger communities through mutual aid and connection.
                    </p>
                </footer>
            </div>
        </>
    );
}

export default Welcome;
