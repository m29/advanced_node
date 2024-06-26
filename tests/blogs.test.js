const Page = require('./helpers/page');

let page;

beforeEach(async () => {
    page = await Page.build();
    await page.goto('http://localhost:3000');
});

afterEach(async () => {
    await page.close();
});

describe('when logged in', () => {

    beforeEach(async () => {
        await page.login();
        await page.click('a.btn-floating.btn-large.red');
    });

    it('can see blog create form', async () => {
        const label = await page.getContentsOf('form label');
        expect(label).toEqual('Blog Title');
    });

    describe('and using invalid inputs', () => {

        beforeEach(async () => {
            await page.click('form button');
        });

        it('the form shows and erros message', async () => {
            const titleError = await page.getContentsOf('.title .red-text');
            const contentError = await page.getContentsOf('.content .red-text');

            expect(titleError).toEqual('You must provide a value');

            expect(contentError).toEqual('You must provide a value');
        });
    });

    describe('and using valid inputs', () => {

        beforeEach(async () => {
            await page.type('input[name="title"]', 'My title');
            await page.type('input[name="content"]', 'My content is some dummy for the test');

            await page.click('form button');
        });

        it('submitting takes user to review screen', async () => {
            const text = await page.getContentsOf('form h5');
            expect(text).toEqual('Please confirm your entries');
        });

        it('submitting then saving adds blog to index page', async () => {
            //upload the file on review page
            // get the ElementHandle of the selector above
            const inputUploadHandle = await page.$('input[type="file"]');
            // Sets the value of the file input to fileToUpload
            await inputUploadHandle.uploadFile('./tests/test_to_upload.jpeg');
            await page.click('button.green');
            await page.waitFor('.card');

            const title = await page.getContentsOf('.card-title');
            const content = await page.getContentsOf('p');

            expect(title).toEqual('My title');
            expect(content).toEqual('My content is some dummy for the test');
        });

        it('image is shown on blog detail page', async () => {
            //upload the file on review page
            // get the ElementHandle of the selector above
            const inputUploadHandle = await page.$('input[type="file"]');
            // Sets the value of the file input to fileToUpload
            await inputUploadHandle.uploadFile('./tests/test_to_upload.jpeg');
            await page.click('button.green');
            await page.waitFor('.card');
            await page.click('.card-action a');
            await page.waitFor(3000);

            const imageLoaded = await page.evaluate(async () => {
                // Scroll down to bottom of page to activate lazy loading images
                document.body.scrollIntoView(false);

                // Wait for all remaining lazy loading images to load
                return await Promise.all(Array.from(document.getElementsByTagName('img'), image => {
                    if (image.complete) {
                        return true;
                    }

                    return new Promise((resolve, reject) => {
                        image.addEventListener('load', resolve);
                        image.addEventListener('error', reject);
                    });
                }))
            });
            expect(imageLoaded).toEqual([true]);
        });
    });
});

describe('when not logged in', () => {

    const actions = [{
            method: 'get',
            path: 'api/blogs',
        },
        {
            method: 'post',
            path: 'api/blogs',
            data: {
                title: 'My Title',
                content: 'My Content testing'
            }
        }
    ];

    it('cannot do blog related actions', async () => {
        const results = await page.execRequests(actions);

        for (let result of results) {
            expect(result).toEqual({ error: 'You must log in!' });
        }
    });
});