# Genetic Algorithm Viz


### Basic Usage

After downloading, simply edit the HTML and CSS files included with the template in your favorite text editor to make changes. These are the only files you need to worry about, you can ignore everything else! To preview the changes you make to the code, you can open the `index.html` file in your web browser.

### Advanced Usage

After installation, run `npm install` and then run `gulp dev` which will open up a preview of the template in your default browser, watch for changes to core template files, and live reload the browser when changes are saved. You can view the `gulpfile.js` to see which tasks are included with the dev environment.

### Deployment
1. Create API credentials that have sufficient permissions to S3. More info here.
2. Go to your website directory
3. Run s3_website cfg create. This generates a configuration file called `s3_website.yml.
4. Put your AWS credentials and the S3 bucket name into the file
5. Run `s3_website cfg apply. This will configure your bucket to function as an S3 website. If the bucket does not exist, the command will create it for you

After development run `s3_website push`



#### Gulp Tasks

- `gulp` the default task that builds everything
- `gulp dev` browserSync opens the project in your default browser and live reloads when changes are made
- `gulp css` compiles SCSS files into CSS and minifies the compiled CSS
- `gulp js` minifies the themes JS file
- `gulp vendor` copies dependencies from node_modules to the vendor directory

You must have npm and Gulp installed globally on your machine in order to use these features.

## Bugs and Issues
- Swiching node colors does not work fully 
- ...
- ...

## About

This project was based on "Start Bootstrap" which is an open source library of free Bootstrap templates and themes.
