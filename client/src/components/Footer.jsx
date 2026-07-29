import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-emerald-900/10 border-t border-border-custom py-12 text-text-primary mt-12">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="flex flex-col gap-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="material-symbols-rounded text-primary text-3xl">eco</span>
            <span className="font-primary font-bold text-xl text-primary">ReWear</span>
          </Link>
          <p className="text-text-secondary text-sm">
            Swap clothes, save money, and protect the environment. Join our circular sustainable fashion revolution today.
          </p>
        </div>
        
        <div>
          <h4 className="font-primary font-bold mb-4">Marketplace</h4>
          <ul className="flex flex-col gap-2 text-sm text-text-secondary">
            <li><Link to="/explore" className="hover:text-primary">Browse Garments</Link></li>
            <li><Link to="/explore?category=Outerwear" className="hover:text-primary">Outerwear jackets</Link></li>
            <li><Link to="/explore?category=Denim" className="hover:text-primary">Vintage denim</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-primary font-bold mb-4">Community</h4>
          <ul className="flex flex-col gap-2 text-sm text-text-secondary">
            <li><Link to="/" className="hover:text-primary">Eco Points Rules</Link></li>
            <li><Link to="/explore" className="hover:text-primary">Local Swap hubs</Link></li>
            <li><Link to="/" className="hover:text-primary">Slow fashion guidelines</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-primary font-bold mb-4">Join Us</h4>
          <p className="text-text-secondary text-sm mb-4">Subscribe for circular fashion insights, swapping news, and platform updates.</p>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); alert("Subscription successful!"); }}>
            <input type="email" placeholder="Email Address" className="px-4 py-2 border border-border-custom rounded-full bg-white text-sm outline-none w-full" required />
            <button type="submit" className="bg-primary text-white hover:bg-primary-hover px-4 py-2 rounded-full text-sm font-semibold">Join</button>
          </form>
        </div>
      </div>
      
      <div className="container mx-auto px-6 border-t border-border-custom mt-12 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-text-secondary gap-4">
        <p>&copy; {new Date().getFullYear()} ReWear Marketplace. Made with 💚 for the planet.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-primary">Privacy Policy</a>
          <a href="#" className="hover:text-primary">Terms of Service</a>
          <a href="#" className="hover:text-primary">Cookie Policy</a>
        </div>
      </div>
    </footer>
  );
}
