# RAG System for Website Chatbot with Groq (FREE!)
# Requirements: pip install groq langchain-huggingface langchain chromadb python-dotenv

import os
import json
from typing import List, Dict
from groq import Groq
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document
from dotenv import load_dotenv


class WebsiteRAGChatbot:
    def __init__(self, groq_api_key: str, document_path: str):
        """
        Initialize RAG Chatbot with Groq
        
        Args:
            groq_api_key: Groq API key from environment
            document_path: Path to website_info.txt
        """
        # Configure Groq (FREE and FAST!)
        self.client = Groq(api_key=groq_api_key)
        self.model_name = "llama-3.3-70b-versatile"  # Fast and accurate free model
        
        # Initialize embeddings (using free local model)
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        
        # Initialize variables
        self.document_path = document_path
        self.vectorstore = None
        self.conversation_history = []
        
        print("✓ RAG Chatbot initialized successfully with Groq!")
    
    def load_and_process_document(self):
        """
        Step 1: Load document, split into chunks, create embeddings, store in vector DB
        """
        print("\n📄 Step 1: Loading and processing document...")
        
        # Load document
        try:
            with open(self.document_path, 'r', encoding='utf-8') as f:
                content = f.read()
            print(f"✓ Document loaded: {len(content)} characters")
        except FileNotFoundError:
            print(f"✗ Error: File not found at {self.document_path}")
            return False
        
        # Split into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        
        chunks = text_splitter.split_text(content)
        print(f"✓ Document split into {len(chunks)} chunks")
        
        # Create Document objects
        documents = [Document(page_content=chunk) for chunk in chunks]
        
        # Create vector store with embeddings
        print("🔄 Creating embeddings and storing in vector database...")
        self.vectorstore = Chroma.from_documents(
            documents=documents,
            embedding=self.embeddings,
            persist_directory="./chroma_db"
        )
        
        print("✓ Vector database created successfully!")
        return True
    
    def retrieve_context(self, query: str, top_k: int = 3) -> str:
        """
        Step 2: Retrieve relevant context from vector database
        
        Args:
            query: User's question
            top_k: Number of relevant chunks to retrieve
            
        Returns:
            Combined context from top relevant chunks
        """
        print(f"\n🔍 Step 2: Retrieving context for query: '{query}'")
        
        if not self.vectorstore:
            print("✗ Error: Vector store not initialized!")
            return ""
        
        # Retrieve relevant documents
        relevant_docs = self.vectorstore.similarity_search(query, k=top_k)
        
        # Combine retrieved chunks
        context = "\n\n".join([doc.page_content for doc in relevant_docs])
        
        print(f"✓ Retrieved {len(relevant_docs)} relevant chunks ({len(context)} characters)")
        return context
    
    def generate_response(self, query: str, context: str) -> str:
        """
        Step 3: Generate response using Groq LLM with retrieved context
        
        Args:
            query: User's question
            context: Retrieved context from vector DB
            
        Returns:
            Generated response from Groq
        """
        print("\n🤖 Step 3: Generating response with Groq LLM...")
        
        # Create prompt with context
        prompt = f"""You are a helpful website assistant chatbot. Use the following context from the website to answer the user's question accurately and professionally.

Context from website:
{context}

User Question: {query}

Instructions:
- Provide clear, accurate answers based on the context
- Be friendly and professional
- If the information is in the context, use it
- If you're not sure, say so politely
- Format your response in a conversational way

Answer:"""
        
        try:
            # Generate response using Groq
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model=self.model_name,
                temperature=0.7,
                max_tokens=1024,
            )
            
            answer = chat_completion.choices[0].message.content
            
            print("✓ Response generated successfully!")
            return answer
            
        except Exception as e:
            print(f"✗ Error generating response: {str(e)}")
            return "I apologize, but I encountered an error. Please try again."
    
    def chat(self, user_query: str) -> str:
        """
        Main chat function - combines all steps
        
        Args:
            user_query: User's question
            
        Returns:
            Chatbot's response
        """
        print("\n" + "="*60)
        print(f"USER: {user_query}")
        print("="*60)
        
        # Step 2: Retrieve context
        context = self.retrieve_context(user_query)
        
        # Step 3: Generate response
        response = self.generate_response(user_query, context)
        
        # Store in conversation history
        self.conversation_history.append({
            "user": user_query,
            "assistant": response
        })
        
        print("\n" + "="*60)
        print(f"ASSISTANT: {response}")
        print("="*60)
        
        return response
    
    def save_conversation(self, filename: str = "conversation_history.json"):
        """Save conversation history to file"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.conversation_history, f, indent=2, ensure_ascii=False)
        print(f"\n✓ Conversation saved to {filename}")


def main():
    """
    Main function to run the RAG chatbot
    """
    print("🚀 Website RAG Chatbot System (Powered by Groq)")
    print("="*60)
    
    # Load environment variables from .env file
    load_dotenv()
    
    # Configuration
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    DOCUMENT_PATH = "website_info.txt"
    
    # Check if API key is set
    if not GROQ_API_KEY:
        print("\n⚠️  ERROR: GROQ_API_KEY not found in environment!")
        print("\nPlease update your .env file with:")
        print("GROQ_API_KEY=your_groq_api_key_here")
        print("\n🔑 Get your FREE Groq API key from: https://console.groq.com/keys")
        print("   (No credit card required!)")
        return
    
    # Initialize chatbot
    chatbot = WebsiteRAGChatbot(
        groq_api_key=GROQ_API_KEY,
        document_path=DOCUMENT_PATH
    )
    
    # Step 1: Load and process document
    success = chatbot.load_and_process_document()
    if not success:
        return
    
    print("\n✅ RAG System ready! You can now ask questions.")
    print("Type 'quit' to exit\n")
    
    # Interactive chat loop
    while True:
        try:
            user_input = input("\nYou: ").strip()
            
            if user_input.lower() in ['quit', 'exit', 'q']:
                print("\n👋 Saving conversation and exiting...")
                chatbot.save_conversation()
                break
            
            if not user_input:
                continue
            
            # Get response
            chatbot.chat(user_input)
            
        except KeyboardInterrupt:
            print("\n\n👋 Interrupted. Saving conversation...")
            chatbot.save_conversation()
            break
        except Exception as e:
            print(f"\n✗ Error: {str(e)}")
            continue


if __name__ == "__main__":
    main()