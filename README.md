# MoonMail Models

[MoonMail](https://github.com/microapps/MoonMail), powerful email marketing tool, built on Serverless Framework allows you to deliver campaigns over Amazon’s cloud network. MoonMail Models is a nodejs package that provides the data persistance layer, sitting on top of DynamoDB.

--

### Getting Started
We are assuming that you'll run this code inside an AWS Lambda function, with a role that has enough permissions to read/write DynamoDB.

Install the package:

    npm install https://github.com/microapps/moonmail-models

Set the required environment variables with the corresponding DynamoDB table names:

    LINKS_TABLE
    CAMPAIGNS_TABLE

--

## Contributing Guidelines
Contributions are always welcome! If you'd like to collaborate with us, take into account that:

* We use [ES2015](https://babeljs.io/docs/learn-es2015/) and love OOP.
* We test with [mocha](https://github.com/mochajs/mocha) + [chai](https://github.com/chaijs/chai) + [sinon](https://github.com/sinonjs/sinon).

Feel free to <a href="mailto:hi@microapps.com">contact us</a> if you have any question!

--

### Credits
Developed by [microapps] (http://microapps.com/)

--
## License
MoonMail is available under the MIT license. See the LICENSE file for more info.
