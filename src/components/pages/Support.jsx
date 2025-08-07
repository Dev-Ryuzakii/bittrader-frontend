import React from 'react'

const Support = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Support</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="border-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Contact Support</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="How can we help you?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                className="w-full px-3 py-2 border rounded-md h-32"
                placeholder="Describe your issue..."
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#2F00FF] to-[#1C0099] text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Submit Ticket
            </button>
          </form>
        </div>
        <div className="space-y-6">
          <div className="border-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">FAQs</h2>
            <div className="space-y-3">
              <button className="w-full text-left p-3 bg-gray-50 rounded-md hover:bg-gray-100">
                How do I reset my password?
              </button>
              <button className="w-full text-left p-3 bg-gray-50 rounded-md hover:bg-gray-100">
                How to connect my trading account?
              </button>
              <button className="w-full text-left p-3 bg-gray-50 rounded-md hover:bg-gray-100">
                Where can I find my API keys?
              </button>
            </div>
          </div>
          <div className="border-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <div className="space-y-2">
              <p className="text-gray-600">Email: support@tradexas.com</p>
              <p className="text-gray-600">Phone: +1 (555) 123-4567</p>
              <p className="text-gray-600">Hours: 24/7 Support</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Support
