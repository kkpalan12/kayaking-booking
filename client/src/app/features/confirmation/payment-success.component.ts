import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './payment-success.component.html',
  styleUrl: './payment-success.component.scss',
})
export class PaymentSuccessComponent {
  bookingId = '';

  constructor(private readonly route: ActivatedRoute) {
    this.bookingId =
      this.route.snapshot.queryParamMap.get(
        'razorpay_payment_link_reference_id',
      ) || '';
  }
}
