export const quotes = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "The pain you feel today will be the strength you feel tomorrow.", author: "Arnold Schwarzenegger" },
  { text: "Champions aren't made in the gyms. Champions are made from something they have deep inside — a desire, a dream, a vision.", author: "Muhammad Ali" },
  { text: "I hated every minute of training, but I said, don't quit. Suffer now and live the rest of your life as a champion.", author: "Muhammad Ali" },
  { text: "You have to be willing to suffer more than anyone else.", author: "David Goggins" },
  { text: "Stay hard.", author: "David Goggins" },
  { text: "The most important conversations you'll ever have are the ones you'll have with yourself.", author: "David Goggins" },
  { text: "We must all suffer one of two things: the pain of discipline or the pain of regret.", author: "Jim Rohn" },
  { text: "It's not about how hard you can hit. It's about how hard you can get hit and keep moving forward.", author: "Rocky Balboa" },
  { text: "The greats never stop wanting it.", author: "Kobe Bryant" },
  { text: "Everything negative — pressure, challenges — is all an opportunity for me to rise.", author: "Kobe Bryant" },
  { text: "The moment you give up is the moment you let someone else win.", author: "Kobe Bryant" },
  { text: "I'll do what they won't do today so I can do what they can't do tomorrow.", author: "Kobe Bryant" },
  { text: "Without ambition one starts nothing. Without work one finishes nothing.", author: "Ralph Waldo Emerson" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "That which does not kill us makes us stronger.", author: "Friedrich Nietzsche" },
  { text: "What doesn't kill you makes you stronger.", author: "Friedrich Nietzsche" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "If you're not embarrassed by the first version of your product, you've launched too late.", author: "Reid Hoffman" },
  { text: "Move fast and break things.", author: "Mark Zuckerberg" },
  { text: "Code is not just about machines — it's about ideas.", author: "Naval Ravikant" },
  { text: "Seek wealth, not money or status. Wealth is having assets that earn while you sleep.", author: "Naval Ravikant" },
  { text: "The way to get good at hard things is to do hard things consistently.", author: "Naval Ravikant" },
  { text: "Learn to sell. Learn to build. If you can do both, you will be unstoppable.", author: "Naval Ravikant" },
  { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein" },
  { text: "Genius is 1% inspiration and 99% perspiration.", author: "Thomas Edison" },
  { text: "The future belongs to those who prepare for it today.", author: "Malcolm X" },
  { text: "If you want to change the world, go home and love your family.", author: "Mother Teresa" },
  { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "Stay hungry. Stay foolish.", author: "Steve Jobs" },
  { text: "Sleep is the cousin of death.", author: "Nas" },
  { text: "Work like there is someone working 24 hours a day to take it away from you.", author: "Mark Cuban" },
  { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
  { text: "Sweat more in training, bleed less in war.", author: "Ancient Proverb" },
  { text: "The mind is the limit. As long as the mind can envision the fact that you can do something, you can do it.", author: "Arnold Schwarzenegger" },
  { text: "The worst thing I can be is the same as everybody else.", author: "Arnold Schwarzenegger" },
  { text: "You can't build a reputation on what you are going to do.", author: "Henry Ford" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "Knowledge is power.", author: "Francis Bacon" },
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "I fear not the man who has practiced 10,000 kicks once, but I fear the man who has practiced one kick 10,000 times.", author: "Bruce Lee" },
  { text: "Do not pray for an easy life. Pray for the strength to endure a difficult one.", author: "Bruce Lee" },
  { text: "Be water, my friend.", author: "Bruce Lee" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
  { text: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius" },
  { text: "You have power over your mind, not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "Difficulties strengthen the mind, as labor does the body.", author: "Seneca" },
  { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca" },
  { text: "First, have a definite, clear practical ideal — a goal, an objective.", author: "Aristotle" },
];

export function getRandomQuote() {
  return quotes[Math.floor(Math.random() * quotes.length)];
}

export function getDailyQuote(): { text: string; author: string } {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return quotes[dayOfYear % quotes.length];
}
