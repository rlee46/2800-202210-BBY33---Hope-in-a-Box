'use strict';

/**
 * Npm packages that are required for our application to run
 */
require('dotenv').config();
const express = require("express");
var session = require("express-session");
const mysql = require("mysql2");
const app = express();
const fs = require("fs");
const bcrypt = require("bcrypt");
const multer = require("multer");
const {
    JSDOM
} = require('jsdom');

/**
 * {boolean} is_heroku - Config var to determine if app is being run on heroku or local machine.
 */
const is_heroku = process.env.IS_HEROKU || false;

/**
 * Db configuration for running on local machine.
 */
const localconfig = {
    host: "localhost",
    user: "root",
    password: "",
    database: "COMP2800",
};

/**
 * Db configuration for running on heroku.
 */
const herokuconfig = {
    host: process.env.HEROKU_HOST,
    user: process.env.HEROKU_USER,
    password: process.env.HEROKU_PASSWORD,
    database: process.env.HEROKU_DATABASE
};

/**
 * This block creates a connection pool that automatically opens/reuses and closes connections.
 */
var connection;
if (is_heroku) {
    connection = mysql.createPool(herokuconfig);
} else {
    connection = mysql.createPool(localconfig);
}

/**
 * Set up storage for uploading images.
 */
const storage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, "./public/userImg/")
    },
    filename: function(req, file, callback) {
        callback(null, "profilePic-" + file.originalname.split('/').pop().trim());
    }
});
const upload = multer({
    storage: storage
});

// Stripe implementation adapted from https://www.geeksforgeeks.org/how-to-integrate-stripe-payment-gateway-in-node-js/ and https://www.stripe.com/
const stripe = require('stripe')(process.env.YOUR_SECRET_KEY);

var isAdmin = false;
var packageN = "";

//path mapping 
app.use("/js", express.static("./public/js"));
app.use("/css", express.static("./public/css"));
app.use("/img", express.static("./public/img"));
app.use("/userImg", express.static("./public/userImg"));
app.use("/fonts", express.static("./public/fonts"));
app.use("/html", express.static("./app/html"));
app.use("/media", express.static("./public/media"));
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

app.use(session({
    secret: "hope in a box",
    name: "stanleySessionID",
    resave: false,
    saveUninitialized: true
}));


// redirects user after successful login
app.get("/", function(req, res) {
    if (req.session.loggedIn) {
        if (req.session.isAdmin === 'n' && req.session.isCharity === 'n') {
            res.redirect("/landing");
        } else if (req.session.isCharity === 'y' && req.session.isAdmin === 'n') {
            res.redirect("/charity");
        } else {
            res.redirect("/admin");
        }

    } else {
        let doc = fs.readFileSync("./app/html/login.html", "utf8");
        res.send(doc);
    }
});

/**
 * Route handler for the admin page (accessable only for admin).
 * @param {string} "/admin" - path requested for admin dashboard.
 * @param {callback} - loads the admin page or redirects to login if user is not logged in.
 */
app.get("/admin", async (req, res) => {
    if (req.session.loggedIn && isAdmin === true) {
        let profile = fs.readFileSync("./app/html/admin.html", "utf-8");
        let profileDOM = new JSDOM(profile);
        res.send(profileDOM.serialize());
    } else {
        res.redirect("/");
    }
});

/**
 * Route handler for the admin add new user page (accessable only for admin).
 * @param {string} "/admin-add-users" - path requested for admin add users dashboard.
 * @param {callback} - loads the admin add users page or redirects to login if user is not logged in.
 */
app.get("/admin-add-users", async (req, res) => {
    if (req.session.loggedIn && req.session.isAdmin === 'y') {
        let profile = fs.readFileSync("./app/html/adminAddUsers.html", "utf-8");
        let profileDOM = new JSDOM(profile);

        res.send(profileDOM.serialize());
    } else {
        res.redirect("/");
    }
});

/**
 * Route handler for the landing page (accessable for regular users).
 * @param {string} "/landing" - path requested for landing page.
 * @param {callback} - loads the landing page or redirects to login if user is not logged in.
 */
app.get("/landing", async (req, res) => {
    if (req.session.loggedIn && req.session.isAdmin === 'n' && req.session.isCharity === 'n') {
        let profile = fs.readFileSync("./app/html/landing.html", "utf-8");
        let profileDOM = new JSDOM(profile);

        res.send(profileDOM.serialize());
    } else {
        res.redirect("/");
    }
});

/**
 * Route handler for the charity dashboard (accessable for charity users).
 * @param {string} "/charity" - path requested for charity dashboard.
 * @param {callback} - loads charity dashboard or redirects to login if user is not logged in.
 */
app.get("/charity", async (req, res) => {
    if (req.session.loggedIn && req.session.isAdmin === 'n' && req.session.isCharity === 'y') {
        let profile = fs.readFileSync("./app/html/charityAccounts.html", "utf-8");
        let profileDOM = new JSDOM(profile);

        res.send(profileDOM.serialize());
    } else {
        res.redirect("/");
    }
});

/**
 * Route handler for the navbar.
 * @param {string} "/nav" - path requested for navbar.
 * @param {callback} - loads the navbar into the page or redirects to login if user is not logged in.
 */
app.get("/nav", (req, res) => {
    if (req.session.loggedIn) {
        let profile = fs.readFileSync("./app/html/nav.html", "utf-8");
        let profileDOM = new JSDOM(profile);

        res.send(profileDOM.serialize());
    } else {
        res.redirect("/");
    }
})

/**
 * Route handler for the admin sidebar.
 * @param {string} "/admin-sidebar" - path requested for navbar.
 * @param {callback} - loads the sidebar into the page or redirects to login if user is not logged in.
 */
app.get("/admin-sideBar", (req, res) => {
    if (req.session.loggedIn) {
        let profile = fs.readFileSync("./app/html/adminSideBar.html", "utf-8");
        let profileDOM = new JSDOM(profile);

        res.send(profileDOM.serialize());
    } else {
        res.redirect("/");
    }
})

/**
 * Route handler for the footer.
 * @param {string} "/footer" - path requested for footer.
 * @param {callback} - loads the footer into the page or redirects to login if user is not logged in.
 */
app.get("/footer", (req, res) => {
    if (req.session.loggedIn) {
        let profile = fs.readFileSync("./app/html/footer.html", "utf-8");
        let profileDOM = new JSDOM(profile);

        res.send(profileDOM.serialize());
    } else {
        res.redirect("/");
    }
})

/**
 * Route handler for the login page.
 * @param {string} "/login" - path requested for navbar.
 * @param {callback} - loads the login page if user is not logged in previously.
 * If user is logged it it will take them to admin or landing page depending on credentials.
 * Compares hashed passwords using bcrypt.
 */
app.post("/login", async function (req, res) {
    if (req.session.loggedIn && req.session.isAdmin === 'y') {
        res.redirect("/admin");
    } else if (req.session.loggedIn && req.session.isAdmin === 'n' && req.session.isCharity === 'y') {
        res.redirect("/charity");
    } else if (req.session.loggedIn && req.session.isAdmin === 'n') {
        res.redirect("/landing");
    } else {
        res.setHeader("Content-Type", "application/json");
        let pwd = req.body.password;
        await connection.execute(
            "SELECT * FROM BBY_33_user WHERE BBY_33_user.user_name = ? AND BBY_33_user.user_removed = ?", [req.body.user_name, 'n'], async(err, rows) => {
                if (rows.length > 0) {
                    let hashedPassword = rows[0].password
                    let comparison = await bcrypt.compare(req.body.password, hashedPassword);
                    if (comparison) {
                        if (rows[0].admin_user === 'y') {
                            isAdmin = true;
                        }
                        req.session.loggedIn = true;
                        req.session.user_name = rows[0].user_name;
                        req.session.user_id = rows[0].USER_ID;
                        req.session.password = pwd;
                        req.session.name = rows[0].first_name;
                        req.session.isAdmin = rows[0].admin_user;
                        req.session.isCharity = rows[0].charity_user;
                        res.send({
                            status: "success",
                            msg: "Logged in."
                        });
                    } else {
                        res.send({
                            status: "fail",
                            msg: "Invalid Username or Password."
                        });
                    }
                } else {
                    res.send({
                        status: "fail",
                        msg: "Invalid Username or Password."
                    });
                }
            }
        );

    }
});

/**
 * Route handler for getting all registered users.
 * @param {string} "/get-users" - path requested for all users.
 * @param {callback} - retrieves and sends the users or redirects to login if user is not logged in.
 */
app.get("/get-users", function (req, res) {
    if (req.session.loggedIn) {
        connection.query(
            "SELECT * FROM bby_33_user",
            function(error, results) {
                if (error) {
                    console.log(error);
                }
                res.send({
                    status: "success",
                    rows: results
                });
            }
        );
    } else {
        res.redirect("/");
    }
});

/**
 * Route handler for logging out.
 * @param {string} "/logout" - path requested for logout.
 * @param {callback} - destroys the active session.
 */
app.get("/logout", function (req, res) {
    if (req.session) {
        req.session.destroy(function(error) {
            if (error) {
                res.status(400).send("Unable to log out")
            } else {
                isAdmin = false;
                let doc = fs.readFileSync("./app/html/login.html", "utf8");
                res.send(doc);
            }
        });
    }
});

/**
 * Route handler for registering a new account.
 * @param {string} "/register" - path requested for updating db with new account.
 * @param {callback} - Trims input and checks special characters.
 * Uses bcrypt to hash password stored in db.
 */
app.post("/register", function (req, res) {
    res.setHeader("Content-Type", "application/json");

    let usr = req.body.user_name;
    usr = usr.replace(/\s+/g, '');
    let pwd = req.body.password;
    let firstName = req.body.firstName;
    firstName = firstName.replace(/\s+/g, '');
    let lastName = req.body.lastName;
    lastName = lastName.replace(/\s+/g, '')
    let email = req.body.userEmail;
    email = email.replace(/\s+/g, '');
    let confirmPassword = req.body.passwordConfirm;
    var existingUsers;
    let alreadyExists = false;
    let salt = 5;
    let hashedPassword = "";

    connection.execute(
        "SELECT * FROM BBY_33_user WHERE user_removed = 'n'",
        function (error, results, fields) {
            var validChars = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
            existingUsers = results;
            let send = {
                status: " ",
                msg: " "
            }
            if (usr == "" || pwd == "" || firstName == "" || lastName == "" || email == "" || confirmPassword == "") {
                send.status = "fail";
                send.msg = "Please fill out all fields";
            } else if (!email.match(validChars)){
                send.status = "fail";
                send.msg = "Improper Email Format";
            }else {
                if (pwd == confirmPassword) {
                    let i = 0;
                    while (!alreadyExists && i < existingUsers.length) {
                        if (existingUsers[i].user_name === usr || existingUsers[i].email_address === email) {
                            alreadyExists = true;
                            send.status = "fail";
                            send.msg = "Username or email already exists";
                        } else {
                            alreadyExists = false;
                        }
                        i++;
                    }
                    if (alreadyExists == false) {
                        bcrypt.hash(pwd, salt, function(err, hash) {
                            hashedPassword = hash;
                            connection.execute(
                                "INSERT INTO BBY_33_user(user_name, first_name, last_name, email_address, admin_user, charity_user, user_removed, password, user_image) VALUES(?, ?, ?, ?, 'n', 'n', 'n', ?, 'stock-profile.png')", [usr, firstName, lastName, email, hashedPassword]
                            );
                        });
                        send.status = "success";
                        send.msg = "Registered Successfully";
                    }
                } else {
                    send.status = "fail";
                    send.msg = "Passwords do not match";
                }
            }
            res.send(send);

        }
    )
});

/**
 * Route handler for redirecting to create account page.
 * @param {string} "/createAccount" - path requested for accessing create account page.
 * @param {callback} - Redirects the user.
 */
app.get("/createAccount", function (req, res) {
    let profile = fs.readFileSync("./app/html/createAccount.html", "utf8");
    let profileDOM = new JSDOM(profile);

    res.send(profileDOM.serialize());
});

/**
 * Route handler for the mobile footer.
 * @param {string} "/footer2" - path requested for mobile footer.
 * @param {callback} - loads the mobile footer into the page.
 */
app.get("/footer2", function (req, res) {
    let profile = fs.readFileSync("./app/html/footer2.html", "utf8");
    let profileDOM = new JSDOM(profile);

    res.send(profileDOM.serialize());
});

/**
 * Route handler for the Who We Are page.
 * @param {string} "/whoWeAre" - path requested for page about us.
 * @param {callback} - loads the page and does not reguire login.
 */
app.get("/whoWeAre", function (req, res) {
    let profile = fs.readFileSync("./app/html/whoWeAre.html", "utf8");
    let profileDOM = new JSDOM(profile);

    res.send(profileDOM.serialize());
});

/**
 * Route handler for the Join Our Team.
 * @param {string} "/joinOurTeam" - path requested for Join Our Team page.
 * @param {callback} - loads the page and does not reguire login.
 */
app.get("/joinOurTeam", function (req, res) {
    let profile = fs.readFileSync("./app/html/joinOurTeam.html", "utf8");
    let profileDOM = new JSDOM(profile);

    res.send(profileDOM.serialize());
});

/**
 * Route handler for the Support.
 * @param {string} "/Support" - path requested for support page.
 * @param {callback} - loads the page and does not reguire login.
 */
app.get("/Support", function (req, res) {
    let profile = fs.readFileSync("./app/html/support.html", "utf8");
    let profileDOM = new JSDOM(profile);

    res.send(profileDOM.serialize());
});

/**
 * Route handler for the FAQ.
 * @param {string} "/FAQ" - path requested for FAQ page.
 * @param {callback} - loads the page and does not reguire login.
 */
app.get("/FAQ", function (req, res) {
    let profile = fs.readFileSync("./app/html/faq.html", "utf8");
    let profileDOM = new JSDOM(profile);

    res.send(profileDOM.serialize());
});

/**
 * Route handler for the user profile page.
 * @param {string} "/profile" - path requested for the profile page.
 * @param {callback} - loads the page or redirects to login page if the user is not logged in.
 */
app.get("/profile", function (req, res) {
    if (req.session.loggedIn) {
        let profile = fs.readFileSync("./app/html/profile.html", "utf8");
        let profileDOM = new JSDOM(profile);

        res.send(profileDOM.serialize());
    } else {
        res.redirect("/");
    }
});

/**
 * Route handler for the map page.
 * @param {string} "/map" - path requested for the map.
 * @param {callback} - loads the page or redirects to login page if the user is not logged in.
 */
app.get("/map", function (req, res) {

    if (req.session.loggedIn) {
        let profile = fs.readFileSync("./app/html/map.html", "utf8");
        let profileDOM = new JSDOM(profile);

        res.send(profileDOM.serialize());
    } else {
        res.redirect("/");
    }
});

/**
 * Route handler for the order confirmation page.
 * @param {string} "/success" - path requested for order confirmation.
 * @param {callback} - loads the page or redirects to login page if the user is not logged in.
 */
app.get("/success", function (req, res) {
    if (req.session.loggedIn) {
        let profile = fs.readFileSync("./app/html/success.html", "utf8");
        let profileDOM = new JSDOM(profile);

        res.send(profileDOM.serialize());
    } else {
        res.redirect("/");
    }
});

/**
 * Route handler for the order history page.
 * @param {string} "/getOrders" - path requested for order history page.
 * @param {callback} - loads the page or redirects to login page if the user is not logged in.
 */
app.get("/getOrders", function (req, res) {
    if (req.session.loggedIn) {
        let profile = fs.readFileSync("./app/html/orders.html", "utf8");
        let profileDOM = new JSDOM(profile);

        res.send(profileDOM.serialize());
    } else {
        res.redirect("/");
    }
});

/**
 * Route handler for accesssing current user name.
 * @param {string} "/user-name" - path requested for user name.
 * @param {callback} - sends the data or redirects to login page if the user is not logged in.
 */
app.get("/user-name", (req, res) => {
    if (req.session.loggedIn) {
        res.send({
            status: "success",
            name: req.session.user_name
        });
    } else {
        res.redirect("/");
    }
})

/**
 * Route handler for accesssing current email.
 * @param {string} "/email" - path requested for email.
 * @param {callback} - sends the data or redirects to login page if the user is not logged in.
 */
app.get("/email", (req, res) => {
    if (req.session.loggedIn) {
        let stat;
        connection.query(
            `SELECT email_address FROM bby_33_user WHERE user_name = ?`, [req.session.user_name], (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    stat = "success";
                    res.send({
                        status: stat,
                        rows: result
                    });
                }
            }

        )
    } else {
        res.redirect("/");
    }
})

/**
 * Route handler for accesssing current user first name.
 * @param {string} "/first-name" - path requested for user first name.
 * @param {callback} - sends the data or redirects to login page if the user is not logged in.
 */
app.get("/first-name", (req, res) => {
    if (req.session.loggedIn) {
        let stat;
        connection.query(
            `SELECT first_name FROM bby_33_user WHERE user_name = ?`, [req.session.user_name], (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    stat = "success";
                    res.send({
                        status: stat,
                        rows: result
                    });
                }
            }

        )
    } else {
        res.redirect("/");
    }
})

/**
 * Route handler for accesssing current user last name.
 * @param {string} "/first-name" - path requested for user last name.
 * @param {callback} - sends the data or redirects to login page if the user is not logged in.
 */
app.get("/last-name", (req, res) => {
    if (req.session.loggedIn) {
        let stat;
        connection.query(
            `SELECT last_name FROM bby_33_user WHERE user_name = ?`, [req.session.user_name], (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    stat = "success";
                    res.send({
                        status: stat,
                        rows: result
                    });
                }
            }

        )
    } else {
        res.redirect("/");
    }
})

/**
 * Route handler for updating current user name from profile page.
 * @param {string} "/update-user-name" - path requested for updating db.
 * @param {callback} - updates db or redirects to login page if the user is not logged in.
 */
app.post("/update-user-name", (req, res) => {
    if (req.session.loggedIn) {
        let send = {
            status: "fail",
            msg: "Record not updated."
        };
        connection.execute(
            `UPDATE bby_33_user SET user_name = ? WHERE user_name = ?`, [req.body.name, req.session.user_name], (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    send.status = "success";
                    send.msg = "Record Updated";
                }
            }
        );
        req.session.user_name = req.body.name;
        res.send(send);

    } else {
        res.redirect("/");
    }
})

/**
 * Route handler for updating current email from profile page.
 * @param {string} "/update-email" - path requested for updating db.
 * @param {callback} - updates db or redirects to login page if the user is not logged in.
 */
app.post("/update-email", (req, res) => {
    if (req.session.loggedIn) {
        let send = {
            status: "fail",
            msg: "Record not updated."
        };
        connection.execute(
            `UPDATE bby_33_user SET email_address = ? WHERE user_name = ?`, [req.body.email, req.session.user_name], (err) => {
                if (err) {
                    console.log(err);
                } else {
                    send.status = "success";
                    send.msg = "Record Updated";
                }
            }
        );
        res.send(send);

    } else {
        res.redirect("/");
    }
})

/**
 * Route handler for updating user first name from admin dashboard.
 * @param {string} "/admin-update-firstName" - path requested for updating db.
 * @param {callback} - updates db or redirects to login page if the user is not logged in.
 */
app.post("/admin-update-firstName", (req, res) => {
    if (req.session.loggedIn) {
        let firstName = req.body.firstName.replace(/\s+/g, '');
        let send = {
            status: "fail",
            msg: "Record not updated."
        };
        connection.execute(
            `UPDATE bby_33_user SET first_name = ? WHERE email_address = ?`, [firstName, req.body.email], (err) => {
                if (err) {
                    console.log(err);
                } else {
                    send.status = "success";
                    send.msg = "Record Updated";
                }
            }
        );
        res.send(send);

    } else {
        res.redirect("/");
    }
})

/**
 * Route handler for updating user last name from admin dashboard.
 * @param {string} "/admin-update-lastName" - path requested for updating db.
 * @param {callback} - updates db or redirects to login page if the user is not logged in.
 */
app.post("/admin-update-lastName", (req, res) => {
    if (req.session.loggedIn) {
        let send = {
            status: "fail",
            msg: "Record not updated."
        };
        connection.execute(
            `UPDATE bby_33_user SET last_name = ? WHERE email_address = ?`, [req.body.lastName.replace(/\s+/g, ''), req.body.email], (err) => {
                if (err) {
                    console.log(err);
                } else {
                    send.status = "success";
                    send.msg = "Record Updated";
                }
            }
        );
        res.send(send);

    } else {
        res.redirect("/");
    }
})

/**
 * Route handler for updating user admin status from admin dashboard.
 * @param {string} "/admin-update-admin" - path requested for updating db.
 * @param {callback} - updates db or redirects to login page if the user is not logged in.
 */
app.post("/admin-update-admin", (req, res) => {
    if (req.session.loggedIn) {
        let send = {
            status: "fail",
            msg: "Record not updated."
        };
        connection.execute(
            `UPDATE bby_33_user SET admin_user = ? WHERE email_address = ?`, [req.body.admin.replace(/\s+/g, ''), req.body.email], (err) => {
                if (err) {
                    console.log(err);
                } else {
                    send.status = "success";
                    send.msg = "Record Updated";
                }
            }
        );
        res.send(send);

    } else {
        res.redirect("/");
    }
})

/**
 * Route handler for updating user email from admin dashboard.
 * @param {string} "/admin-update-email" - path requested for updating db.
 * @param {callback} - updates db or redirects to login page if the user is not logged in.
 */
app.post("/admin-update-email", (req, res) => {
    if (req.session.loggedIn) {
        let send = {
            status: "fail",
            msg: "Record not updated."
        };
        connection.execute(
            `UPDATE bby_33_user SET email_address = ? WHERE email_address = ?`, [req.body.email_address.replace(/\s+/g, ''), req.body.email], (err) => {
                if (err) {
                    console.log(err);
                } else {
                    send.status = "success";
                    send.msg = "Record Updated";
                }
            }
        );
        res.send(send);

    } else {
        res.redirect("/");
    }
})

/**
 * Route handler for updating user password from profile page.
 * @param {string} "/update-password" - path requested for updating db.
 * @param {callback} - updates db or redirects to login page if the user is not logged in.
 */
app.post("/update-password", async (req, res) => {
    if (req.session.loggedIn) {
        let existingPassword;
        let salt = 5;
        let hashedPassword = "";
        let send = {
            status: "",
            msg: ""
        };
        await connection.execute(
            "SELECT * FROM BBY_33_user WHERE BBY_33_user.user_name = ?", [req.session.user_name], async(err, rows) => {
                existingPassword = rows[0].password
                let comparison = await bcrypt.compare(req.body.currentPass, existingPassword);
                if (comparison) {
                    existingPassword = req.body.newPass;
                    bcrypt.hash(existingPassword, salt, function(err, hash) {
                        hashedPassword = hash;
                        connection.execute(
                            "UPDATE bby_33_user SET password = ? WHERE user_name = ?", [hashedPassword, req.session.user_name]
                        );
                    });
                    send.status = "success";
                    send.msg = "Password Updated";
                } else {
                    send.status = "fail";
                    send.msg = "Current Password is Incorrect";
                }
                res.send(send);
            }
        );

    } else {
        res.redirect("/");
    }
})

/**
 * Route handler for updating user password from admin dashboard.
 * @param {string} "/admin-update-password" - path requested for updating db.
 * @param {callback} - updates db or redirects to login page if the user is not logged in.
 */
app.post("/admin-update-password", async (req, res) => {
    if (req.session.loggedIn) {
        const mysql = require("mysql2/promise");
        let existingPassword;
        let salt = 5;
        let hashedPassword = "";

        let send = {
            status: "",
            msg: ""
        };
        await connection.execute(
            "SELECT * FROM BBY_33_user WHERE BBY_33_user.user_name = ?", [req.body.email], async(err, rows) => {
                existingPassword = req.body.newPass;
                bcrypt.hash(existingPassword, salt, function(err, hash) {
                    hashedPassword = hash;
                    connection.execute(
                        "UPDATE bby_33_user SET password = ? WHERE email_address = ?", [hashedPassword, req.body.email]
                    );
                });
                send.status = "success";
                send.msg = "Password Updated";

                res.send(send);
            }
        );

    } else {
        res.redirect("/");
    }
})

/**
 * Route handler for uploading profile picture to user account.
 * @param {string} "/upload-user-images" - path requested for updating db.
 * @param {callback} - updates db or redirects to login page if the user is not logged in.
 */
app.post('/upload-user-images', upload.array("files", 1), function (req, res) {
    if (req.session.loggedIn) {
        let send = {
            status: "fail",
            msg: "Record not updated."
        };
        connection.execute(
            `UPDATE bby_33_user SET user_image = ? WHERE user_name = ?`, [req.files[0].filename, req.session.user_name], (err) => {
                if (err) {
                    console.log(err);
                } else {
                    send.status = "success";
                    send.msg = "Record Updated";
                }
            }
        );

    } else {
        res.redirect("/");
    }
});

/**
 * Route handler for retrieveing stored profile picture to user account.
 * @param {string} "/get-user-images" - path requested for updating db.
 * @param {callback} - sends data or redirects to login page if the user is not logged in.
 */
app.get('/get-user-images', upload.array("files"), function (req, res) {
    if (req.session.loggedIn) {
        connection.query(
            `SELECT user_image FROM bby_33_user WHERE user_name = ?`, [req.session.user_name], (err, result) => {
                if (err) {
                    res.send({
                        status: "fail"
                    });
                } else {
                    res.send({
                        status: "success",
                        path: "/userImg/" + result[0].user_image
                    });
                }
            }

        )
    } else {
        res.redirect("/");
    }

});

/**
 * Route handler for soft deleting user from admin dashboard.
 * @param {string} "/delete-users" - path requested for updating db.
 * @param {callback} - updates db or redirects to login page if the user is not logged in.
 */
app.post("/delete-users", function (req, res) {
    if (req.session.loggedIn) {
        res.setHeader("Content-Type", "application/json");

        let adminUsers = [];
        let userID = req.body.userID;
        connection.execute(
            "SELECT * FROM bby_33_user WHERE admin_user = ? AND user_removed = ?", ['y', 'n'],
            function(error, results) {
                adminUsers = results;
                let send = {
                    status: ""
                };
                connection.execute(
                    "SELECT * FROM bby_33_user WHERE USER_ID = ?", [userID],
                    function(error, admins) {
                        if (admins[0].admin_user == 'y') {
                            if (adminUsers.length > 1) {
                                connection.execute(
                                    "UPDATE bby_33_user SET user_removed = ? WHERE USER_ID = ? AND admin_user = ?", ['y', userID, 'y'],
                                    function(error, results) {
                                        if (error) {
                                            console.log(error);
                                            send.status = "fail";
                                        } else {
                                            send.status = "success";
                                        }
                                    }
                                );
                            } else {
                                send.status = "fail";
                            }
                        } else {
                            connection.execute(
                                "UPDATE bby_33_user SET user_removed = ? WHERE USER_ID = ? AND admin_user = ?", ['y', userID, 'n'],
                                function(error, results) {
                                    if (error) {
                                        console.log(error);
                                        send.status = "fail";
                                    } else {
                                        send.status = "success";
                                    }
                                }
                            );
                        }
                        res.send(send);
                    }
                );
            }
        );
    } else {
        res.redirect("/");
    }
});

/**
 * Route handler for reactivating user from admin dashboard.
 * @param {string} "/undelete-users" - path requested for updating db.
 * @param {callback} - updates db or redirects to login page if the user is not logged in.
 */
app.post("/undelete-users", function (req, res) {
    if (req.session.loggedIn) {
        res.setHeader("Content-Type", "application/json");

        let userID = req.body.userID;
        connection.execute(
            "UPDATE bby_33_user SET user_removed = ? WHERE USER_ID = ?", ['n', userID],
            function(error, results) {
                if (error) {
                    console.log(error);
                    res.send({
                        status: "fail",
                    });
                } else {
                    res.send({
                        status: "success",
                    });
                }
            }
        );
    } else {
        res.redirect("/");
    }
});

/**
 * Route handler for getting all packages related to a given country.
 * @param {string} "/get-packages" - path requested for getting packages.
 * @param {callback} - sends data or redirects to login page if the user is not logged in.
 */
app.post("/get-packages", function (req, res) {
    if (req.session.loggedIn) {
        res.setHeader("Content-Type", "application/json");
        let countryID = req.body.countryID;
        connection.query(
            "SELECT bby_33_country.country FROM bby_33_country WHERE COUNTRY_ID = ?", [countryID],
            function(error, results) {
                let countryName = results[0].country;
                connection.execute(
                    `UPDATE bby_33_package SET package_destination = ? WHERE country_id = ?`, [countryName, countryID]
                )
            }
        );
        connection.query(
            "SELECT bby_33_package.package_name, bby_33_package.package_price, bby_33_package.description_of_package, bby_33_package.package_image, bby_33_package.package_id FROM bby_33_package WHERE COUNTRY_ID = ?", [countryID],
            function(error, results) {
                res.send({
                    status: "success",
                    rows: results
                });
            }
        );
    } else {
        res.redirect("/");
    }
});

/**
 * Route handler for adding a package to shopping cart.
 * @param {string} "/add-packages" - path requested for getting packages.
 * @param {callback} - updates db or redirects to login page if the user is not logged in.
 */
app.post("/add-packages", function (req, res) {
    if (req.session.loggedIn) {
        res.setHeader("Content-Type", "application/json");
        var price = "";
        connection.execute("SELECT bby_33_user.USER_ID FROM bby_33_user WHERE user_name = ?", [req.session.user_name],
            function(err, rows) {
                var packageID = req.body.packageID;
                let userFound = false;
                var userid = rows[0].USER_ID;
                connection.query("SELECT bby_33_package.package_price FROM bby_33_package WHERE PACKAGE_ID = ?", [packageID],
                    function(err, prices) {
                        price = prices[0].package_price
                    });
                userFound = true;
                var send = {
                    status: "fail",
                    msg: "hello"
                };
                if (price != '0') {
                    if (userFound) {
                        connection.query("SELECT * FROM bby_33_cart WHERE user_id = ? AND package_id = ? AND package_purchased = ?", [userid, packageID, 'n'],
                            function(err, packages) {
                                if (packages.length > 0) {
                                    connection.query("SELECT * FROM bby_33_cart WHERE package_id = ? AND user_id = ? AND package_purchased = ?", [packageID, userid, 'n'],
                                        function(err, totalPrice) {
                                            var tPrice = totalPrice[0].price
                                            connection.execute(
                                                `UPDATE bby_33_cart SET product_quantity = ? WHERE package_id = ? AND package_purchased = ?`, [packages[0].product_quantity + 1, packageID, 'n']
                                            )
                                        });
                                    send.status = "success";
                                    send.msg = "Package Added To Cart";
                                    res.send(send);
                                } else {
                                    connection.query("SELECT bby_33_package.package_price, bby_33_package.package_destination FROM bby_33_package WHERE PACKAGE_ID = ?", [packageID],
                                        function(err, pricePackage) {
                                            connection.execute(
                                                "INSERT INTO BBY_33_cart(package_id, product_quantity, user_id, price, package_purchased, cart_destination) VALUES(?, ?, ?, ?, ?, ?)", [packageID, 1, userid, pricePackage[0].package_price, 'n', pricePackage[0].package_destination]
                                            )
                                        });
                                    send.status = "success";
                                    send.msg = "Package Added To Cart";
                                    res.send(send);
                                }
                            });

                    } else {
                        send.status = "fail";
                        send.msg = "Package Did Not Get Added";
                    }
                }
            });
    } else {
        res.redirect("/");
    }
});

/**
 * Route handler for redirecting to information page of a package.
 * @param {string} "/packageInfo" - path requested for getting package info.
 * @param {callback} - sends data or redirects to login page if the user is not logged in.
 */
app.get("/packageInfo", function (req, res) {
    if (req.session.loggedIn) {
        let profile = fs.readFileSync("./app/html/packageInfo.html", "utf8");
        let profileDOM = new JSDOM(profile);

        res.send(profileDOM.serialize());
    } else {
        res.redirect("/");
    }
});

/**
 * Route handler for displaying the contents of a package.
 * @param {string} "/display-package" - path requested for getting package info.
 * @param {callback} - sends data or redirects to login page if the user is not logged in.
 */
app.post("/display-package", function (req, res) {
    if (req.session.loggedIn) {
        res.setHeader("Content-Type", "application/json");

        let packageName = req.body.packageName;
        connection.query(
            "SELECT bby_33_package.PACKAGE_ID, bby_33_package.package_name, bby_33_package.package_price, bby_33_package.description_of_package, bby_33_package.package_image, bby_33_package.package_id, bby_33_package.package_info FROM bby_33_package WHERE package_name = ?", [packageName],
            function(error, results) {
                res.send({
                    status: "success",
                    rows: results
                });
            }
        );
    } else {
        res.redirect("/");
    }
});

/**
 * Route handler for displaying the user's active cart.
 * @param {string} "/get-cart" - path requested for getting cart info.
 * @param {callback} - sends data or redirects to login page if the user is not logged in.
 */
app.get("/get-cart", (req, res) => {
    if (req.session.loggedIn) {
        connection.execute("SELECT bby_33_user.USER_ID FROM bby_33_user WHERE user_name = ?", [req.session.user_name],
            function(err, rows) {
                let send = {
                    rows: ""
                }
                var userid = rows[0].USER_ID;
                connection.execute(
                    `SELECT * FROM bby_33_cart WHERE user_id = ? AND package_purchased = ?`, [userid, 'n'], (err, rows) => {
                        send.rows = rows;
                        res.send(send);
                    }
                )
            }
        )

    } else {
        res.redirect("/");
    }
})

/**
 * Route handler for a charity partner creating a package.
 * @param {string} "/charity-create" - path requested for getting package info.
 * @param {callback} - updates db or redirects to login page if the user is not logged in.
 */
app.post("/charity-create", upload.array("files"), function (req, res) {
    if (req.session.loggedIn) {
        res.setHeader("Content-Type", "application/json");

        var country = req.body.country;
        packageN = req.body.package;
        var packagePrice = req.body.price;
        var packageDesc = req.body.description;
        var longDesc = req.body.longdescription;
        var existingPackage = "";
        connection.execute(
            `SELECT COUNTRY_ID FROM bby_33_country WHERE country = ?`, [country], (err, results) => {
                var countryID = "";
                countryID = results[0].COUNTRY_ID;
                connection.execute(
                    "SELECT * FROM BBY_33_package WHERE package_name = ?", [packageN],
                    function(error, results, fields) {
                        existingPackage = results;
                        let send = {
                            status: " ",
                            msg: " "
                        }
                        if (existingPackage.length == 0) {
                            connection.execute("INSERT INTO BBY_33_package(country_id, package_name, package_price, description_of_package, package_info) VALUES(?, ?, ?, ?, ?)", [countryID, packageN, packagePrice, packageDesc, longDesc]);
                            send.status = "success";
                            send.msg = "Package Successfuly Created";
                        } else {
                            send.status = "fail";
                            send.msg = "Package Already Exists";
                        }
                        res.send(send);

                    }
                )
            }
        )
    } else {
        res.redirect("/");
    }
});

/**
 * Route handler for a charity partner adding a picture to a package.
 * @param {string} "/upload-package-images" - path requested for getting package info.
 * @param {callback} - updates db or redirects to login page if the user is not logged in.
 */
app.post('/upload-package-images', upload.array("files"), function (req, res) {
    if (req.session.loggedIn) {
        let send = {
            status: "fail",
            msg: "Record not updated."
        };
        connection.execute(
            `UPDATE bby_33_package SET package_image = ? WHERE package_name = ?`, ["/userImg/" + req.files[0].filename, packageN], (err) => {
                if (err) {
                    console.log(err);
                } else {
                    send.status = "success";
                    send.msg = "Record Updated";
                }
            }
        );

    } else {
        res.redirect("/");
    }

});

/**
 * Route handler for a successful payment order completed.
 * @param {string} "/checkout" - path requested for getting package info.
 * @param {callback} - updates db or redirects to login page if the user is not logged in.
 */
app.post("/checkout", function (req, res) {
    if (req.session.loggedIn) {
        res.setHeader("Content-Type", "application/json");
        var send = {
            userId: "",
            total: 0,
            order: 0,
            date: "",
            destination: " "
        }
        connection.execute("SELECT bby_33_user.USER_ID FROM bby_33_user WHERE user_name = ?", [req.session.user_name],
            function(err, rows) {
                var userid = rows[0].USER_ID;
                send.userId = req.session.user_name;
                connection.execute("SELECT bby_33_order.ORDER_ID FROM bby_33_order",
                    async function(err, cartid) {
                        await new Promise(() => {

                            var order;
                            var date = new Date();
                            if (cartid.length == 0) {
                                order = 1;
                                connection.execute("INSERT INTO BBY_33_order(order_id, user_id) VALUES(?, ?)", [order, userid],
                                () => {
                                    connection.execute(
                                        `UPDATE bby_33_cart SET package_purchased = ?, order_id = ?, package_date = ? WHERE user_id = ? AND package_purchased = ?`, ['y', order, date, userid, 'n'],
                                        () => {
                                            connection.execute(
                                                "SELECT * FROM BBY_33_cart WHERE order_id = ?", [order],
                                                function (error, orders) {
                                                    connection.execute("UPDATE BBY_33_order SET order_date = ? WHERE ORDER_ID = ?", [orders[0].package_date, order]);
                                                            let destination = ""
                                                            let total = 0;
                                                            for (let i = 0; i < orders.length; i++) {
                                                                total += orders[i].price * orders[i].product_quantity;
                                                            }
                                                            send.date = orders[0].package_date;
                                                            for (let i = 0; i < orders.length - 1; i++) {
                                                                destination += orders[i].cart_destination + ", "
                                                            }
                                                            destination += orders[orders.length - 1].cart_destination;
                                                            send.destination = destination;
                                                            send.total = total;
                                                            send.order = order;
                                                            res.send(send);
                                                }
                                            )
                                        }
                                    );
                                });
                            } else {
                                order = parseInt(cartid[cartid.length - 1].ORDER_ID) + 1;
                                connection.execute("INSERT INTO BBY_33_order(order_id, user_id) VALUES(?, ?)", [order, userid],
                                    () => {
                                        connection.execute(
                                            `UPDATE bby_33_cart SET package_purchased = ?, order_id = ?, package_date = ? WHERE user_id = ? AND package_purchased = ?`, ['y', order, date, userid, 'n'],
                                            () => {
                                                connection.execute(
                                                    "SELECT * FROM BBY_33_cart WHERE order_id = ?", [order],
                                                    function(error, orders) {
                                                        connection.execute("UPDATE BBY_33_order SET order_date = ? WHERE ORDER_ID = ?", [orders[0].package_date, order]);
                                                        let destination = ""
                                                        let total = 0;
                                                        for (let i = 0; i < orders.length; i++) {
                                                            total += orders[i].price * orders[i].product_quantity;
                                                        }
                                                        send.date = orders[0].package_date;
                                                        for (let i = 0; i < orders.length - 1; i++) {
                                                            destination += orders[i].cart_destination + ", "
                                                        }
                                                        destination += orders[orders.length - 1].cart_destination;

                                                        send.destination = destination;
                                                        send.total = total;
                                                        send.order = order;
                                                        res.send(send);
                                                    }
                                                )
                                            }
                                        );
                                    });
                            }
                        })
                    }
                )
            }
        )
    } else {
        res.redirect("/");
    }
});

/**
 * Route handler for a getting contents of a specific order.
 * @param {string} "/get-orders" - path requested for getting package info.
 * @param {callback} - sends data or redirects to login page if the user is not logged in.
 */
app.get("/get-orders", function (req, res) {
    if (req.session.loggedIn) {
        connection.execute("SELECT bby_33_user.USER_ID FROM bby_33_user WHERE user_name = ?", [req.session.user_name],
            function(err, rows) {
                var userid = rows[0].USER_ID;
                connection.query(
                    "SELECT bby_33_order.ORDER_ID, bby_33_order.order_date FROM bby_33_order WHERE bby_33_order.user_id = ? ", [userid],
                    function(error, results) {
                        res.send({
                            status: "success",
                            rows: results
                        });
                    }
                );
            }
        )

    } else {
        res.redirect("/");
    }
});

/**
 * Route handler for a removing all contents from active cart.
 * @param {string} "/removeAll" - path requested for getting package info.
 * @param {callback} - updates db or redirects to login page if the user is not logged in.
 */
app.post("/removeAll", function (req, res) {
    if (req.session.loggedIn) {
        res.setHeader("Content-Type", "application/json");
        connection.execute("DELETE FROM bby_33_cart WHERE package_purchased = ?", ['n']);
    } else {
        res.redirect("/");
    }
});

/**
 * Route handler for a removing specific items from active cart.
 * @param {string} "/delete-item" - path requested for getting package info.
 * @param {callback} - updates db or redirects to login page if the user is not logged in.
 */
app.post("/delete-item", (req, res) => {
    if (req.session.loggedIn) {
        let send = {
            status: "success"
        };
        connection.execute(
            `DELETE FROM bby_33_cart WHERE user_id = ? AND package_id = ? AND package_purchased = ?`, [req.session.user_id, req.body.packageID, 'n']
        );
        res.send(send);
    } else {
        res.redirect("/");
    }
});

/**
 * Route handler for a changing quantities of specific items from active cart.
 * @param {string} "/update-quantity" - path requested for getting package info.
 * @param {callback} - updates db or redirects to login page if the user is not logged in.
 */
app.post("/update-quantity", (req, res) => {
    if (req.session.loggedIn) {
        let send = {
            status: "success"
        };
        connection.execute(
            `UPDATE bby_33_cart SET product_quantity = ? WHERE user_id = ? AND package_id = ?`, [req.body.quantity, req.session.user_id, req.body.packageID]
        );
        res.send(send);
    } else {
        res.redirect("/");
    }
});

/**
 * Route handler for creating a checkout session with stripe.
 * @param {string} "/create-checkout-session" - path requested for getting package info.
 * @param {callback} - creates session or redirects to login page if the user is not logged in.
 */
app.post("/create-checkout-session", async (req, res) => {
    if (req.session.loggedIn) {
        connection.query(
            `SELECT * FROM bby_33_package`,
            async function(error, results) {
                var myMap = new Map()
                for (let i = 0; i < results.length; i++) {
                    myMap.set(results[i].PACKAGE_ID, {
                        priceInCents: results[i].package_price * 100,
                        name: results[i].package_name
                    })
                }
                try {
                    var link;
                    if (is_heroku) {
                        link = process.env.CLIENT_URL;
                    } else {
                        link = process.env.SERVER_URL
                    }
                    const checkout_session = await stripe.checkout.sessions.create({
                        payment_method_types: ["card"],
                        mode: "payment",
                        line_items: req.body.items.map(item => {
                            const storeItem = myMap.get(parseInt(item.id))
                            return {
                                price_data: {
                                    currency: "usd",
                                    product_data: {
                                        name: storeItem.name,
                                    },
                                    unit_amount: storeItem.priceInCents,
                                },
                                quantity: item.quantity,
                            }
                        }),
                        success_url: `${link}/success`,
                        cancel_url: `${link}/map`,
                    })
                    res.json({
                        url: checkout_session.url
                    })
                } catch (e) {
                    res.status(500).json({
                        error: e.message
                    })
                }
            }
        );
    } else {
        res.redirect("/");
    }
})

/**
 * Route handler for getting the total amount a user has donated.
 * @param {string} "/get-total-purchases" - path requested for getting package info.
 * @param {callback} - sends data or redirects to login page if the user is not logged in.
 */
app.get("/get-total-purchases", (req, res) => {
    if (req.session.loggedIn) {
        connection.execute(
            `SELECT price, product_quantity FROM bby_33_cart WHERE user_id = ? AND package_purchased = ?`, [req.session.user_id, 'y'],
            (err, results) => {
                let sum = 0;
                let send = {
                    total: 0
                };
                for (let i = 0; i < results.length; i++) {
                    sum += (parseInt(results[i].price) * parseInt(results[i].product_quantity))
                }
                send.total = sum;
                res.send(send);
            }
        )
    } else {
        res.redirect("/");
    }
})

/**
 * Route handler for redirecting to oder info page.
 * @param {string} "/orderInfo" - path requested for getting package info.
 * @param {callback} - sends data or redirects to login page if the user is not logged in.
 */
app.get("/orderInfo", function (req, res) {
    if (req.session.loggedIn) {
        let profile = fs.readFileSync("./app/html/orderInfo.html", "utf8");
        let profileDOM = new JSDOM(profile);

        res.send(profileDOM.serialize());
    } else {
        res.redirect("/");
    }
});

/**
 * Route handler for getting contents of previous orders.
 * @param {string} "/display-order" - path requested for getting package info.
 * @param {callback} - sends data or redirects to login page if the user is not logged in.
 */
app.post("/display-order", function (req, res) {
    res.setHeader("Content-Type", "application/json");
    if (req.session.loggedIn) {
        res.setHeader("Content-Type", "application/json");
        let order = req.body.orderId;
        connection.query(
            "SELECT bby_33_cart.order_id, bby_33_cart.product_quantity, bby_33_cart.price, bby_33_cart.cart_destination, bby_33_package.package_name FROM bby_33_cart INNER JOIN bby_33_package ON bby_33_cart.PACKAGE_ID=bby_33_package.package_id WHERE bby_33_cart.order_id = ?", [order],
            function(error, results) {
                if (error) {
                    console.log(error);
                }
                res.send({
                    status: "success",
                    rows: results
                });
            }
        );
    } else {
        res.redirect("/");
    }
});

/**
 * Route handler for the How it Works page.
 * @param {string} "/howItWorks" - path requested for How it Works page.
 * @param {callback} - loads the page and does not reguire login.
 */
app.get("/howItWorks", function (req, res) {

    let profile = fs.readFileSync("./app/html/howItWorks.html", "utf8");
    let profileDOM = new JSDOM(profile);

    res.send(profileDOM.serialize());
});

/**
 * Route handler for the Partnerships page.
 * @param {string} "/partnerships" - path requested for How it Works page.
 * @param {callback} - loads the page and does not reguire login.
 */
app.get("/partnerships", function (req, res) {

    let profile = fs.readFileSync("./app/html/partnerships.html", "utf8");
    let profileDOM = new JSDOM(profile);

    res.send(profileDOM.serialize());

});

/**
 * Route handler for the order confirmation page.
 * @param {string} "/order-confirmation" - path requested for How it Works page.
 * @param {callback} - loads the page or redirects to login page if user is not logged in.
 */
app.get("/order-confirmation", function (req, res) {
    if (req.session.loggedIn) {
        let profile = fs.readFileSync("./app/html/orderConfirmation.html", "utf8");
        let profileDOM = new JSDOM(profile);

        res.send(profileDOM.serialize());
    } else {
        res.redirect("/");
    }
});

/**
 * Route handler for the 404 error page.
 * @param {string} "*" - path requested for error page.
 * @param {callback} - loads the page.
 */
app.get("*",(req,res) => {
    let error = fs.readFileSync("./app/html/errorPage.html", "utf8");
    let profileDOM = new JSDOM(error);

    res.send(profileDOM.serialize());
});

/**
 * Determines what port to run on depending if the the app is being run on local machine.
 */
var port = process.env.PORT || 8000;
app.listen(port, function() {
    console.log("Server started on " + port + "!");
});