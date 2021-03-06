# Inlinable Wufoo

[![Build Status](https://travis-ci.org/holidayextras/inlinable-wufoo.svg?branch=master)](https://travis-ci.org/holidayextras/inlinable-wufoo)

Provide a [Wufoo](http://www.wufoo.com/) form, this will break out the fields within so they can be placed inline within an already existing form. Wufoo's form is kept around, and can be passed data when the containing form is submitted if you call a javascript function.

## Usage

Breaking out the fields requires a server to load and modify wufoo's HTML, a basic one is in `server.js`

```
npm start
```

Then your client will need to do something like this:

```javascript
$.get('http://localhost:9595/?account=[WUFOO ACCOUNT NAME]&form=[FORM NAME OR HASH]', function(content) {
  var $form = $('#your-form');

  // Inline the fields from the wufoo form into yours
  $form.append(content.html);

  // When your form is submitted, relay the data back
  // to wufoo (this only includes the relevant fields)
  $form.submit(function() {
    // This requires jquery for html manipulation but does
    // not ship with it - you need to pass it in.
    window[content.submitFunctionName]($);
  });
});
```

## Limitations

This has only been tested with the following field types:

- Single Line Text
- Paragraph Text
- Checkboxes
- Dropdown

Other field types will be rendered, but may or (more likely) may not work. Also bear in mind only the wufoo HTML is passed through, not the JS or CSS, so validation and styling is not available (unless your form implements it itself)

## Testing

```
npm test
```

## AWS API Gateway / Lambda

An adapter / helper script is included for deploying this to AWS API Gateway as a lambda function.

```
npm run build:lambda
```

will ensure only the production dependencies are installed, and zip the project up into the dist/ directory ready for upload into the AWS lambda console. The handler is

```
lambda-adapter.handler
```

Once an API is created in API gateway, you can make a `form` query string available in **Method Request**, and add a mapping template to **Integration Request**; you'll likely want the form to be provided to the API but for the account to be static. An example mapping template that will do this is:

```
{
  "account": "your-wufoo-account",
  "form": "$input.params('form')"
}
```