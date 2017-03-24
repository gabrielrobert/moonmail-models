# MoonMail Models

[MoonMail](https://moonmail.io) Models is a nodejs package that provides the data persistance layer, sitting on top of DynamoDB. Due to the success of this project, which was inintially intended to be exclusive for the MoonMail data storage party, the MoonMail team is already working on an abstraction of this module to be project agnostic so anyone can use it for any data-DynamoDB based project.

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

## Credits
Developed by [microapps](http://microapps.com/?utm_source=moonmail-models-readme&utm_medium=click&utm_campaign=github) Used in [MoonMail](https://moonmail.io/?utm_source=moonmail-models-readme&utm_medium=click&utm_campaign=github) 

--
## License
MoonMail is available under the MIT license. See the LICENSE file for more info.
