'use strict';
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

const is_heroku = process.env.IS_HEROKU || false;
const localconfig = {
    host: "localhost",
    user: "root",
    password: "",
    database: "COMP2800",
};

var connection;
if (is_heroku) {
    connection = mysql.createPool(herokuconfig);
} else {
    connection = mysql.createPool(localconfig);
}

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "./public/userImg/")
    },
    filename: function (req, file, callback) {
        callback(null, "profilePic-" + file.originalname.split('/').pop().trim());
    }
});
const upload = multer({
    storage: storage
});

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
    secret: "eclipse is the worse IDE",
    name: "stanleySessionID",
    resave: false,

    saveUninitialized: true
}));


// redirects user after successful login
app.get("/", function (req, res) {
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

app.get("/admin", async (req, res) => {
    if (req.session.loggedIn && isAdmin === true) {
        let profile = fs.readFileSync("./app/html/admin.html", "utf-8");
        let profileDOM = new JSDOM(profile);
        res.send(profileDOM.serialize());
    } else {
        res.redirect("/");
    }
});

app.get("/admin-add-users", async (req, res) => {
    if (req.session.loggedIn && req.session.isAdmin === 'y') {
        let profile = fs.readFileSync("./app/html/adminAddUsers.html", "utf-8");
        let profileDOM = new JSDOM(profile);

        res.send(profileDOM.serialize());
    } else {
        res.redirect("/");
    }
});

app.get("/landing", async (req, res) => {
    if (req.session.loggedIn && req.session.isAdmin === 'n' && req.session.isCharity === 'n') {
        let profile = fs.readFileSync("./app/html/landing.html", "utf-8");
        let profileDOM = new JSDOM(profile);

        res.send(profileDOM.serialize());
    } else {
        res.redirect("/");
    }
});

app.get("/charity", async (req, res) => {
    if (req.session.loggedIn && req.session.isAdmin === 'n' && req.session.isCharity === 'y') {
        let profile = fs.readFileSync("./app/html/charityAccounts.html", "utf-8");
        let profileDOM = new JSDOM(profile);

        res.send(profileDOM.serialize());
    } else {
        res.redirect("/");
    }
});

app.get("/nav", (req, res) => {
    if (req.session.loggedIn) {
        let profile = fs.readFileSync("./app/html/nav.html", "utf-8");
        let profileDOM = new JSDOM(profile);

        res.send(profileDOM.serialize());
    } else {
        res.redirect("/");
    }
})

app.get("/admin-sideBar", (req, res) => {
    if (req.session.loggedIn) {
        let profile = fs.readFileSync("./app/html/adminSideBar.html", "utf-8");
        let profileDOM = new JSDOM(profile);

        res.send(profileDOM.serialize());
    } else {
        res.redirect("/");
    }
})

app.get("/footer", (req, res) => {
    if (req.session.loggedIn) {
        let profile = fs.readFileSync("./app/html/footer.html", "utf-8");
        let profileDOM = new JSDOM(profile);

        res.send(profileDOM.serialize());
    } else {
        res.redirect("/");
    }
})



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
            "SELECT * FROM BBY_33_user WHERE BBY_33_user.user_name = ? AND BBY_33_user.user_removed = ?", [req.body.user_name, 'n'], async (err, rows) => {
                if (rows.length > 0) {
                    let hashedPassword = rows[0].password
                    let comparison = await bcrypt.compare(req.body.password, hashedPassword);
                    if (comparison) {
                        if (rows[0].admin_user === 'y') {
                            isAdmin = true;
                        }
                        req.session.loggedIn = true;
                        req.session.user_name = rows[0].user_name;
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

app.get("/get-users", function (req, res) {
    if (req.session.loggedIn) {
        connection.query(
            "SELECT * FROM bby_33_user",
            function (error, results) {
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

app.get("/logout", function (req, res) {

    if (req.session) {
        req.session.destroy(function (error) {
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

app.post("/user-update", function (req, res) {
    if (req.session.loggedIn) {
        let adminUsers = [];
        connection.execute(
            "SELECT * FROM bby_33_user WHERE admin_user = ? AND user_removed = ?", ['y', 'n'],
            function (error, results) {
                adminUsers = results;
                let send = {
                    status: "fail",
                    msg: "Record not updated."
                };
                connection.query("UPDATE bby_33_user SET user_removed = ? WHERE email_address = ? AND admin_user = ?", ['y', req.body.email, 'n'], (err) => {
                    send.status = "success";
                    send.msg = "Record updated"
                });
                if (adminUsers.length > 1) {
                    connection.query("UPDATE bby_33_user SET user_removed = ? WHERE email_address = ? AND admin_user = ?", ['y', req.body.email, 'y'], (err) => {
                        send.status = "success";
                        send.msg = "Record updated"
                    });
                } else {
                    send.status = "fail";
                }
                res.send(send);
                connection.end();
            }
        );
    } else {
        res.redirect("/");
    }


});

app.post("/register", function (req, res) {
    res.setHeader("Content-Type", "application/json");

    let usr = req.body.user_name;
    let pwd = req.body.password;
    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    let email = req.body.userEmail;
    let confirmPassword = req.body.passwordConfirm;
    var existingUsers;
    let alreadyExists = false;
    let salt = 5;
    let hashedPassword = "";

    connection.execute(
        "SELECT * FROM BBY_33_user WHERE user_removed = 'n'",
        function (error, results, fields) {
            existingUsers = results;
            let send = {
                status: " ",
                msg: " "
            }
            if (usr == "" || pwd == "" || firstName == "" || lastName == "" || email == "" || confirmPassword == "") {
                send.status = "fail";
                send.msg = "Please fill out all fields";
            } else {
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
                        bcrypt.hash(pwd, salt, function (err, hash) {
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

app.get("/createAccount", function (req, res) {
    let profile = fs.readFileSync("./app/html/createAccount.html", "utf8");
    let profileDOM = new JSDOM(profile);

    res.send(profileDOM.serialize());
});

app.get("/footer2", function (req, res) {
    let profile = fs.readFileSync("./app/html/footer2.html", "utf8");
    let profileDOM = new JSDOM(profile);

    res.send(profileDOM.serialize());
});

app.get("/whoWeAre", function (req, res) {
    let profile = fs.readFileSync("./app/html/whoWeAre.html", "utf8");
    let profileDOM = new JSDOM(profile);

    res.send(profileDOM.serialize());
});

app.get("/FAQ", function (req, res) {
    let profile = fs.readFileSync("./app/html/faq.html", "utf8");
    let profileDOM = new JSDOM(profile);

    res.send(profileDOM.serialize());
});

app.get("/profile", function (req, res) {

    if (req.session.loggedIn) {
        let profile = fs.readFileSync("./app/html/profile.html", "utf8");
        let profileDOM = new JSDOM(profile);

        res.send(profileDOM.serialize());
    } else {
        res.redirect("/");
    }
});

app.get("/map", function (req, res) {

    if (req.session.loggedIn) {
        let profile = fs.readFileSync("./app/html/map.html", "utf8");
        let profileDOM = new JSDOM(profile);

        res.send(profileDOM.serialize());
    } else {
        res.redirect("/");
    }
});

app.get("/getOrders", function (req, res) {

    if (req.session.loggedIn) {
        let profile = fs.readFileSync("./app/html/orders.html", "utf8");
        let profileDOM = new JSDOM(profile);

        res.send(profileDOM.serialize());
    } else {
        res.redirect("/");
    }
});

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

app.post("/admin-update-firstName", (req, res) => {
    if (req.session.loggedIn) {
        let send = {
            status: "fail",
            msg: "Record not updated."
        };
        connection.execute(
            `UPDATE bby_33_user SET first_name = ? WHERE email_address = ?`, [req.body.firstName, req.body.email], (err) => {
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

app.post("/admin-update-lastName", (req, res) => {
    if (req.session.loggedIn) {
        let send = {
            status: "fail",
            msg: "Record not updated."
        };
        connection.execute(
            `UPDATE bby_33_user SET last_name = ? WHERE email_address = ?`, [req.body.lastName, req.body.email], (err) => {
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

app.post("/admin-update-admin", (req, res) => {
    if (req.session.loggedIn) {
        let send = {
            status: "fail",
            msg: "Record not updated."
        };
        connection.execute(
            `UPDATE bby_33_user SET admin_user = ? WHERE email_address = ?`, [req.body.admin, req.body.email], (err) => {
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

app.post("/admin-update-email", (req, res) => {
    if (req.session.loggedIn) {
        let send = {
            status: "fail",
            msg: "Record not updated."
        };
        connection.execute(
            `UPDATE bby_33_user SET email_address = ? WHERE email_address = ?`, [req.body.email_address, req.body.email], (err) => {
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
            "SELECT * FROM BBY_33_user WHERE BBY_33_user.user_name = ?", [req.session.user_name], async (err, rows) => {
                existingPassword = rows[0].password
                let comparison = await bcrypt.compare(req.body.currentPass, existingPassword);
                if (comparison) {
                    existingPassword = req.body.newPass;
                    bcrypt.hash(existingPassword, salt, function (err, hash) {
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
            "SELECT * FROM BBY_33_user WHERE BBY_33_user.user_name = ?", [req.body.email], async (err, rows) => {
                existingPassword = req.body.newPass;
                bcrypt.hash(existingPassword, salt, function (err, hash) {
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

app.post("/delete-users", function (req, res) {
    if (req.session.loggedIn) {
        res.setHeader("Content-Type", "application/json");

        let adminUsers = [];
        let userID = req.body.userID;
        connection.execute(
            "SELECT * FROM bby_33_user WHERE admin_user = ? AND user_removed = ?", ['y', 'n'],
            function (error, results) {
                adminUsers = results;
                let send = {
                    status: ""
                };
                connection.execute(
                    "SELECT * FROM bby_33_user WHERE USER_ID = ?", [userID],
                    function (error, admins) {
                        if (admins[0].admin_user == 'y') {
                            if (adminUsers.length > 1) {
                                connection.execute(
                                    "UPDATE bby_33_user SET user_removed = ? WHERE USER_ID = ? AND admin_user = ?", ['y', userID, 'y'],
                                    function (error, results) {
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
                                function (error, results) {
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

app.post("/undelete-users", function (req, res) {
    if (req.session.loggedIn) {
        res.setHeader("Content-Type", "application/json");

        let userID = req.body.userID;
        connection.execute(
            "UPDATE bby_33_user SET user_removed = ? WHERE USER_ID = ?", ['n', userID],
            function (error, results) {
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
    }
});

app.post("/get-packages", function (req, res) {
    if (req.session.loggedIn) {
        res.setHeader("Content-Type", "application/json");
        let countryID = req.body.countryID;
        connection.query(
            "SELECT bby_33_package.package_name, bby_33_package.package_price, bby_33_package.description_of_package, bby_33_package.package_image, bby_33_package.package_id FROM bby_33_package WHERE COUNTRY_ID = ?", [countryID],
            function (error, results) {
                if (error) {
                    console.log(error);
                }
                res.send({
                    status: "success",
                    rows: results
                });
            }
        );
    }
});

app.post("/add-packages", function (req, res) {
    if (req.session.loggedIn) {
        res.setHeader("Content-Type", "application/json");
        var price = "";
        connection.execute("SELECT bby_33_user.USER_ID FROM bby_33_user WHERE user_name = ?", [req.session.user_name],
            function (err, rows) {
                var packageID = req.body.packageID;
                let userFound = false;
                var userid = rows[0].USER_ID;
                connection.query("SELECT bby_33_package.package_price FROM bby_33_package WHERE PACKAGE_ID = ?", [packageID],
                    function (err, prices) {
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
                            function (err, packages) {
                                if (packages.length > 0) {
                                    connection.query("SELECT * FROM bby_33_cart WHERE package_id = ? AND user_id = ? AND package_purchased = ?", [packageID, userid, 'n'],
                                        function (err, totalPrice) {
                                            var tPrice = totalPrice[0].price
                                            connection.execute(
                                                `UPDATE bby_33_cart SET  product_quantity = ?, price = ? WHERE package_id = ? AND package_purchased = ?`, [packages[0].product_quantity + 1, tPrice + price, packageID, 'n']
                                            )
                                        });
                                    send.status = "success";
                                    send.msg = "Package Added To Cart";
                                    res.send(send);
                                } else {
                                    connection.query("SELECT bby_33_package.package_price FROM bby_33_package WHERE PACKAGE_ID = ?", [packageID],
                                        function (err, pricePakcage) {
                                            connection.execute(
                                                "INSERT INTO BBY_33_cart(package_id, product_quantity, user_id, price, package_purchased) VALUES(?, ?, ?, ?, ?)", [packageID, 1, userid, pricePakcage[0].package_price, 'n']
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

app.get("/packageInfo", function (req, res) {

    if (req.session.loggedIn) {
        let profile = fs.readFileSync("./app/html/packageInfo.html", "utf8");
        let profileDOM = new JSDOM(profile);

        res.send(profileDOM.serialize());
    } else {
        res.redirect("/");
    }
});

app.post("/display-package", function (req, res) {
    res.setHeader("Content-Type", "application/json");

    let packageName = req.body.packageName;
    if (req.session.loggedIn) {
        connection.query(
            "SELECT bby_33_package.PACKAGE_ID, bby_33_package.package_name, bby_33_package.package_price, bby_33_package.description_of_package, bby_33_package.package_image, bby_33_package.package_id FROM bby_33_package WHERE package_name = ?", [packageName],
            function (error, results) {
                if (error) {
                    console.log(error);
                }
                res.send({
                    status: "success",
                    rows: results
                });
            }
        );
    }
});


app.get("/get-cart", (req, res) => {
    if (req.session.loggedIn) {
        connection.execute("SELECT bby_33_user.USER_ID FROM bby_33_user WHERE user_name = ?", [req.session.user_name],
            function (err, rows) {
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

app.post("/charity-create", upload.array("files"), function (req, res) {
    res.setHeader("Content-Type", "application/json");

    let country = req.body.country;
    packageN = req.body.package;
    let packagePrice = req.body.price;
    let packageDesc = req.body.description;
    var existingPackage = "";
    connection.execute(
        "SELECT * FROM BBY_33_package WHERE package_name = ?", [packageN],
        function (error, results, fields) {
            existingPackage = results;
            let send = {
                status: " ",
                msg: " "
            }
            if (existingPackage.length == 0) {
                connection.execute("INSERT INTO BBY_33_package(country_id, package_name, package_price, description_of_package) VALUES(?, ?, ?, ?)", [country, packageN, packagePrice, packageDesc]);
                send.status = "success";
            } else {
                send.status = "fail";
                send.msg = "Package Already Exists";
            }
            res.send(send);

        }
    )
});

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

app.post("/checkout", function (req, res) {
    if (req.session.loggedIn) {
        res.setHeader("Content-Type", "application/json");
        connection.execute("SELECT bby_33_user.USER_ID FROM bby_33_user WHERE user_name = ?", [req.session.user_name],
            function (err, rows) {
                let send = {
                    rows: ""
                }
                var userid = rows[0].USER_ID;
                connection.execute(
                    `UPDATE bby_33_cart SET package_purchased = ? WHERE user_id = ?`, ['y', userid]
                );
            }
        )
    }
});

app.get("/get-orders", function (req, res) {
    if (req.session.loggedIn) {
        connection.execute("SELECT bby_33_user.USER_ID FROM bby_33_user WHERE user_name = ?", [req.session.user_name],
            function (err, rows) {
                var userid = rows[0].USER_ID;
                connection.query(
                    "SELECT bby_33_cart.product_quantity, bby_33_cart.price, bby_33_package.package_name FROM bby_33_cart INNER JOIN bby_33_package ON bby_33_cart.PACKAGE_ID=bby_33_package.package_id WHERE bby_33_cart.user_id = ? AND bby_33_cart.package_purchased = ?", [userid, 'y'],
                    function (error, results) {
                        if (error) {
                            console.log(error);
                        }
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
var port = process.env.PORT || 8000;
app.listen(port, function () {
    console.log("Server started on " + port + "!");
});
