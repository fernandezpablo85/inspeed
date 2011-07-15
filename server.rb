require 'rubygems'
require 'sinatra'
require 'erb'

get '/' do
  @development = params[:dev]
  erb :home
end