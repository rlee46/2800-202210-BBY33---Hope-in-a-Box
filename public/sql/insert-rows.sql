INSERT INTO BBY_33_user (USER_ID, user_name, first_name, last_name, email_address, admin_user, charity_user, user_removed, user_image, password) VALUES (1, 'Ryan', 'Ryan', 'Lee', 'rlee@gmai.com', 'y', 'n', 'n', 'stock-profile.png', '$2b$05$g5VHP8khA5O9xkGcdlM/3ul6vZZdOsOP9gO5hatfXUG0/E8tO97DO');
INSERT INTO BBY_33_user (USER_ID, user_name, first_name, last_name, email_address, admin_user, charity_user, user_removed, user_image, password) VALUES (2, 'Brandon', 'Brandon', 'Chan', 'bchan@gmail.com', 'n', 'n', 'n', 'stock-profile.png', '$2b$05$K92x1ZJamdrrqmDP1.6hmevOWvXIUAOHppSQ9Ayz6W1CWCQe7zoty');
INSERT INTO BBY_33_user (USER_ID, user_name, first_name, last_name, email_address, admin_user, charity_user, user_removed, user_image, password) VALUES (3, 'Stanley', 'Stanley', 'Chow', 'schow@gmail.com', 'n', 'n', 'n', 'stock-profile.png', '$2b$05$w7sUSvF5EHM48mzq97saL.U0qq3J0WrZwbK7JNCbBWV6pGaJI0VXu');
INSERT INTO BBY_33_user (USER_ID, user_name, first_name, last_name, email_address, admin_user, charity_user, user_removed, user_image, password) VALUES (4, 'Artem', 'Artem', 'Khan', 'akhan@gmail.com', 'y', 'n', 'n', 'stock-profile.png', '$2b$05$BHarNBknV0SGrHLzg4dUteihG9/Js12Wvl3reyfahX66xxd9OiYb2');
INSERT INTO BBY_33_user (USER_ID, user_name, first_name, last_name, email_address, admin_user, charity_user, user_removed, user_image, password) VALUES (5, 'Patrick', 'Patrick', 'Guichon', 'pg@gmail.com', 'n', 'y', 'n', 'stock-profile.png', '$2b$05$BHarNBknV0SGrHLzg4dUteihG9/Js12Wvl3reyfahX66xxd9OiYb2');

INSERT INTO BBY_33_country (COUNTRY_ID, country, description_of_country) VALUES (1, 'Ukraine', 'Country invaded by Russia');
INSERT INTO BBY_33_country (COUNTRY_ID, country, description_of_country) VALUES (2, 'Afghanistan', 'Ongoing war');
INSERT INTO BBY_33_country (COUNTRY_ID, country, description_of_country) VALUES (3, 'Yemen', 'Food Shortage');
INSERT INTO BBY_33_country (COUNTRY_ID, country, description_of_country) VALUES (4, 'Ethiopia', 'Heavy flooding');
INSERT INTO BBY_33_country (COUNTRY_ID, country, description_of_country) VALUES (5, 'Democratic Republic of Congo', 'Civil unrest');

INSERT INTO BBY_33_package (PACKAGE_ID, country_id, package_name, package_price, description_of_package, package_image, package_info) VALUES (1, 1, 'Package 1', 20, 'Contains Water, Canned food and Clothing', '/img/landing1.jpg', 'Package 1 was curated by the Ukrainian Red Cross Society, containing non-perishable food, clothing, and a first aid kit.
This care package will be distributed to a family that has been impacted by the invasion of Ukraine.');

INSERT INTO BBY_33_package (PACKAGE_ID, country_id, package_name, package_price, description_of_package, package_image, package_info) VALUES (2, 2, 'Package 2', 30, 'Contains Water, Canned food and Medicine', '/img/landing1.jpg', 'Package 2 was curated by Afghan Charity Organisation, containing non-perishable food, children''s clothing, and medicine. This care package
will be distributed to a family that has been displaced by due to war.');

INSERT INTO BBY_33_package (PACKAGE_ID, country_id, package_name, package_price, description_of_package, package_image, package_info) VALUES (3, 3, 'Package 3', 35, 'Contains Water, Canned food and Clothing', '/img/landing1.jpg', 'Package 3 was curated by the Yemen Relief and Reconstruction Foundation, containing non-perishable food and water. This care package
will be distributed to an individual in Yemen, which has been facing a prolonged famine.');

INSERT INTO BBY_33_package (PACKAGE_ID, country_id, package_name, package_price, description_of_package, package_image, package_info) VALUES (4, 4, 'Package 4', 30, 'Contains Water, and Water', '/img/landing1.jpg', 'Package 4 was curated by imagine1day, a non-profit organization working in Ethiopia. This care package contains drinking water,
and will be distributed to individuals in Ethiopia. Ethiopia is currently experiencing heaving flooding, which has contaminated the water supply.');

INSERT INTO BBY_33_package (PACKAGE_ID, country_id, package_name, package_price, description_of_package, package_image, package_info) VALUES (5, 5, 'Package 5', 40, 'Contains Water, Canned food and Clothing', '/img/landing1.jpg', 'Package 5 was curated by Save the Children, containing non-perishable food, medicine and children''s clothing. This care package will be distributed to families in the
Democratic Republic of Congo, which is currently facing civil unrest.');
