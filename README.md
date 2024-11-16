# Gmaps-scraper
This powerful web scraping bot helps you efficiently gather business information, including names, phone numbers, addresses, categories, and websites, from specific cities and industries.
The bot outputs the collected data in a well-structured Excel format and supports custom filters to refine results based on your needs.

## Installation
1. Clone the repository:
 ```bash
git clone https://github.com/Emmanuel-Rods/Gmaps-Scraper.git
 ```
2. Navigate to the project folder:
```bash
cd Gmaps-Scraper
```
3. Install the necessary dependencies:
```bash
npm install
```
## Usage

To run the bot, use the following command:
```bash
npm run bot
```
This command will start the Scraper

### Configuration Options

You can customize the scraper by modifying the script’s configuration. Below are the key options:

#### 1. **Disable Filters**

You can enable or disable filters by setting the `disableFilters` variable:

```js 
const disableFilters = false; // Set to true to disable all filters
``` 

#### 2. **Categories**

Specify the categories of businesses you want to scrape. Add your desired categories to the `categories` array:

```js
const categories = ["Scaffolding hire", "Skip hire"]; // Add or modify categories as needed
``` 

#### 3. **Cities**

List the cities you want to target in the `cities` array:

```js
const cities = ["London", "Manchester"]; // Add or modify cities as needed
```



