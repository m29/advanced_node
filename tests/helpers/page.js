const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/sessionFactory');
const userFactory = require('../factories/userFactory');

class CustomPage {

    constructor(page, browser) {
        this.page = page;
        //this.browser = browser;
    }

    static async build() {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox']
        });

        const page = await browser.newPage();

        const customPage = new CustomPage(page, browser);

        return new Proxy(customPage, {
            get: function(target, property) {
                return customPage[property] || browser[property] || page[property];
            }
        });
    }

    async login() {
        const user = await userFactory();
        const { session, sig } = sessionFactory(user);
        await this.page.setCookie({ name: 'session', value: session });
        await this.page.setCookie({ name: 'session.sig', value: sig });
        await this.page.goto('http://localhost:3000/blogs');
        await this.page.waitFor('a[href="/auth/logout"]');
    }

    // close() {
    //     this.browser.close();
    // }

    async getContentsOf(selector) {
        return this.page.$eval(selector, el => el.innerHTML);
    }

    async get(route) {
        return this.page.evaluate((_route) => {
            return fetch(_route, {
                method: 'GET',
                credentials: 'same-origin',
            }).then(res => res.json());
        }, route);
    }

    async post(route, data) {
        return this.page.evaluate((_route, _data) => {
            return fetch(_route, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(_data)
            }).then(res => res.json());
        }, route, data);
    }

    async execRequests(actions) {
        return Promise.all(
            actions.map(({ method, path, data }) => {
                return this[method](path, data);
            })
        );
    }
}

module.exports = CustomPage;