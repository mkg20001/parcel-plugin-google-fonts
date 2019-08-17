# parcel-plugin-google-fonts

Automagically rehost google fonts by bundeling them into your application

# What it does

Basically it takes google fonts urls like these

```html
<link href="https://fonts.googleapis.com/css?family=Roboto:regular,bold,italic,thin,light,bolditalic,black,medium&amp;lang=en" rel="stylesheet">
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
```

And downloads them into a local cache while replacing them during the build process

# "This doesn't work. .addAssetMiddleware is not a function!"

This is part of an endeavour to bring middlewares to parcel: https://github.com/parcel-bundler/parcel/pull/3428

Comment at the PR to get it implemented quicker! :smile:
