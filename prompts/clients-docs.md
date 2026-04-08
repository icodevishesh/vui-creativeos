create a client page and onboarding page, with minial and responsive design.

- show the list of clients
- add search bar filter to search clients by entering there name
- add a new client button to add/onboard new clients
- after clicking "+ new client" button it will redirect to onboarding page and show the client onboarding process:
    - basic info:
        1. company name
        2. contact person
        3. email
        4. phone
        5. industry

    then next button
    - Engagement
        - select engagement type:
            1. Retainer: monthly ongoing engagement
            2. Project-based: fixed scope and timeline
    then next button
    - Services
        1. Social Media: Platform management, content creation
        2. Paid Media: Meta, Google, LinkedIn, Amazon ads 
        3. Influencer Marketing: Creator partnerships and campaigns
        4. Email Marketing: Newsletter, drip campaigns, automation

        then complete onboarding button

- after clicking complete onboarding button the post api will call and add the client to db
- show the success react-hot-toast after successfully adding the client to db
- after adding the client to db the client will be visible in the client list

- add validation checks, if the email, phn no or company name is already exists in db then show the error react-hot-toast

