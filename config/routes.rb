Rails.application.routes.draw do
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html

  root 'data_sources#index'

  resources :data_sources, except: :show do
    member do
      # This is the route for data sources pushing to the app, not for the app
      # itself pushing.
      post 'push'
    end

    resources :alerts, except: :show
  end
end