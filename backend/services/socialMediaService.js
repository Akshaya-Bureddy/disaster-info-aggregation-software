import axios from 'axios';
import { TwitterApi } from 'twitter-api-v2';
import NewsAPI from 'newsapi';
import SocialMediaPost from '../models/SocialMediaPost.js';
import dotenv from 'dotenv';

dotenv.config();

const newsapi = new NewsAPI(process.env.NEWS_API_KEY);

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

export const fetchAndStoreSocialMediaPosts = async () => {
  try {
    // Fetch Twitter posts
    const tweets = await twitterClient.v2.search({
      query: 'disaster OR earthquake OR flood OR fire OR cyclone lang:en',
      max_results: 100,
      'tweet.fields': ['created_at', 'geo', 'entities']
    });

    // Process and store tweets
    for (const tweet of tweets.data) {
      await SocialMediaPost.create({
        platform: 'twitter',
        content: tweet.text,
        author: tweet.author_id,
        url: `https://twitter.com/user/status/${tweet.id}`,
        timestamp: tweet.created_at,
        // Add more fields as needed
      });
    }

    // Fetch news articles
    const news = await newsapi.v2.everything({
      q: 'disaster OR natural disaster OR earthquake OR flood',
      language: 'en',
      sortBy: 'publishedAt'
    });

    // Process and store news articles
    for (const article of news.articles) {
      await SocialMediaPost.create({
        platform: 'news',
        content: article.description,
        author: article.author,
        url: article.url,
        imageUrl: article.urlToImage,
        timestamp: article.publishedAt,
        // Add more fields as needed
      });
    }

    console.log('Social media posts fetched and stored successfully');
  } catch (error) {
    console.error('Error fetching social media posts:', error);
  }
};

export const getNearbyPosts = async (latitude, longitude, radius = 50000) => {
  try {
    return await SocialMediaPost.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: radius
        }
      }
    }).sort('-timestamp');
  } catch (error) {
    console.error('Error fetching nearby posts:', error);
    throw error;
  }
};

export const getPostsByDisasterType = async (type) => {
  try {
    return await SocialMediaPost.find({ disasterType: type })
      .sort('-timestamp')
      .limit(100);
  } catch (error) {
    console.error('Error fetching posts by disaster type:', error);
    throw error;
  }
};